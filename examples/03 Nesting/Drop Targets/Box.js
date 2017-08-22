import { Component, PropTypes } from 'react';
import ItemTypes from './ItemTypes';
import { DragSource } from 'react-dnd';

const style = {
  display: 'inline-block',
  border: '1px dashed gray',
  padding: '0.5rem 1rem',
  backgroundColor: 'white',
  cursor: 'move'
};

const boxSource = {
  beginDrag() {
    return {};
  }
};

@DragSource(ItemTypes.BOX, boxSource, (connect) => ({
  connectDragSource: connect.dragSource()
}))
export default class Box extends Component {

  render() {
    const { connectDragSource } = this.props;

    return connectDragSource(
      <div style={style}>
        Drag me
      </div>
    );
  }
}