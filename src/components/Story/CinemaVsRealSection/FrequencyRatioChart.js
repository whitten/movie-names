import React from 'react';
import * as d3 from 'd3';

const decadeDuration = 10;
const thisYear = 2018;

class FrequencyRatioChart extends React.PureComponent {

	state = {
		isLoading: true,
		decade: null,
	};

	timer = null;

	source = [];
	decades = [];
	scales = {
		ratio: d3.scaleLinear().domain([0, 1]),
		order: d3.scaleBand().padding(0)
	};

	showNextDecade = () => {
		const nextDecade = this.state.decade + decadeDuration;
		if (nextDecade > thisYear) {
			clearInterval(this.timer);
			return;
		} 
		this.setState({ decade: nextDecade });
	};

	showDecade = (event) => {
		const decade = +event.target.dataset.decade;
		this.setState({ decade });
	}

	componentDidMount() {
		d3.json("data/top_names/frequencies_decades.json")
			.then((source) => {
				const firtsDecade = d3.min(source, (d) => d.Decade);
				const orders = source
					.find(d => d.Decade === firtsDecade).Stats
					.map(d => d.Order);

				this.source = source;
				this.decades = source.map(d => d.Decade);
				this.scales.order.domain(orders.sort());

				this.timer = setInterval(this.showNextDecade, 500);
				
				this.setState({ 
					isLoading: false,
					decade: firtsDecade
				});
			});
	}

	componentWillUnmount() {
		if (this.timer) {
			clearInterval(this.timer);
		}
	}

	render() {

		if (this.state.isLoading) {
			return (<div className="preloader">Loading...</div>);
		}

		const { width, height } = this.props;
		const { decade } = this.state;

		const data = this.source.find(d => d.Decade === decade).Stats;

		this.updateScales(width, height);

		return (
			<figure className="viz">
				<svg ref={ viz => (this.viz = viz) }
					width={ width } 
					height={ height }>
					{ this.renderItems(data, "Male", width / 2) }
					{ this.renderItems(data, "Female", width / 2) }
					{ this.renderDecades(width / 2, 25) }
				</svg>
			</figure>
		);
	}

	renderDecades(x, y) {
		const currentDecade = this.state.decade;
		return (
			<text className="decades" transform={`translate(${x}, ${y})`}>
			{
				this.decades.map(decade => (
					<tspan
						key={decade}
						data-decade={decade}
						className={ (decade === currentDecade) ? "current" : ""}
						onClick={ this.showDecade }>
							{ ` ${decade} ` }
					</tspan>
				))
			}
			</text>
		);
	}

	renderItems(data, gender, chartWidth) {
		return (
			<g> 
			{
				data.map((item) => {
					
					const itemWidth = this.scales.ratio(item[gender].Ratio);
					const isCinematic = item[gender].Ratio > 0.51;
					const level = this.scales.ratio(item[gender].Ratio);

					return (
						<rect key={`${gender}_${item.Order}`}
							className={`item ${isCinematic ? "cinema" : ""} ${ gender.toLowerCase() }`}
							rx="3" ry="3"
							x={ (gender == "Female") ? chartWidth : level }
							y={ this.scales.order(item.Order) }
							height={ this.scales.order.bandwidth() }
							width={ chartWidth - level }/>
						);
					})
			}
			</g>
		);
	}

	updateScales(width, height) {
		this.scales.ratio.range([ width / 2, 0 ]);
		this.scales.order.range([ 50,  height - 20 ]);
	}
}

export default FrequencyRatioChart;