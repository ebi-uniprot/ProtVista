/** @jsx React.DOM */

var React = require('react');

module.exports =
    React.createClass({
            render: function() {
                return (
                    <div className="helloName" style={this.props.style} id={this.props.id}>
                        Hello {this.props.name}
                    </div>
                )

            }
        }
    );