import preact, { Component } from 'preact';
import shallowEqual from './utils/shallowEqual';
import shallowEqualScalar from './utils/shallowEqualScalar';
import isPlainObject from 'lodash/isPlainObject';
import invariant from 'invariant';
import checkDecoratorArguments from './utils/checkDecoratorArguments';
import hoistStatics from 'hoist-non-react-statics';

export default function DragLayer(collect, options = {}) {
  checkDecoratorArguments('DragLayer', 'collect[, options]', ...arguments);
  invariant(
    typeof collect === 'function',
    'Expected "collect" provided as the first argument to DragLayer ' +
    'to be a function that collects props to inject into the component. ',
    'Instead, received %s. ' +
    'Read more: http://gaearon.github.io/react-dnd/docs-drag-layer.html',
    collect
  );
  invariant(
    isPlainObject(options),
    'Expected "options" provided as the second argument to DragLayer to be ' +
    'a plain object when specified. ' +
    'Instead, received %s. ' +
    'Read more: http://gaearon.github.io/react-dnd/docs-drag-layer.html',
    options
  );

  return function decorateLayer(DecoratedComponent) {
    const { arePropsEqual = shallowEqualScalar } = options;
    const displayName =
      DecoratedComponent.displayName ||
      DecoratedComponent.name ||
      'Component';

    class DragLayerContainer extends Component {
      static DecoratedComponent = DecoratedComponent;

      static displayName = `DragLayer(${displayName})`;

      getDecoratedComponentInstance() {
        return this.child;
      }

      shouldComponentUpdate(nextProps, nextState) {
        return !arePropsEqual(nextProps, this.props) ||
               !shallowEqual(nextState, this.state);
      }

      constructor(props, context) {
        super(props);
        this.handleChange = this.handleChange.bind(this);

        this.manager = context.dragDropManager;
        invariant(
          typeof this.manager === 'object',
          'Could not find the drag and drop manager in the context of %s. ' +
          'Make sure to wrap the top-level component of your app with DragDropContext. ' +
          'Read more: http://gaearon.github.io/react-dnd/docs-troubleshooting.html#could-not-find-the-drag-and-drop-manager-in-the-context',
          displayName,
          displayName
        );

        this.state = this.getCurrentState();
      }

      componentDidMount() {
        this.isCurrentlyMounted = true;

        const monitor = this.manager.getMonitor();
        this.unsubscribeFromOffsetChange = monitor.subscribeToOffsetChange(
          this.handleChange
        );
        this.unsubscribeFromStateChange = monitor.subscribeToStateChange(
          this.handleChange
        );

        this.handleChange();
      }

      componentWillUnmount() {
        this.isCurrentlyMounted = false;

        this.unsubscribeFromOffsetChange();
        this.unsubscribeFromStateChange();
      }

      handleChange() {
        if (!this.isCurrentlyMounted) {
          return;
        }

        const nextState = this.getCurrentState();
        if (!shallowEqual(nextState, this.state)) {
          this.setState(nextState);
        }
      }

      getCurrentState() {
        const monitor = this.manager.getMonitor();
        return collect(monitor);
      }

      setChildRef = (child) => {
        this.child = child;
      }

      render() {
        return (
          <DecoratedComponent {...this.props}
                              {...this.state}
                              ref={this.setChildRef} />
        );
      }
    }

    return hoistStatics(DragLayerContainer, DecoratedComponent);
  };
}
