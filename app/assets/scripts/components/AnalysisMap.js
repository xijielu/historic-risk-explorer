import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import mapboxgl from 'mapbox-gl';
import config from '../config';
import {
  makeExposureLayer,
  getVisibleExposureLayers,
  makeFootPrintSource,
  makeFootPrintLayer
 } from '../utils/map';

import AnalysisLayerControl from './AnalysisLayerControl';
import AnalysisMapLegend from './AnalysisMapLegend';

class AnalysisMap extends Component {
  constructor (props) {
    super(props);
    this._loadLayers = this._loadLayers.bind(this);
    this._addNavigation = this._addNavigation.bind(this);
  }
  static propTypes = {
    disaster: PropTypes.object.isRequired,
    visibleLayer: PropTypes.object.isRequired
  }
  _loadLayers (props) {
    // base layer
    if (props.disaster.dmetric) {
      let id = `${config.mapLayers[props.disaster.dmetric].id}-${props.disaster.c}`;
      let footprintSource = makeFootPrintSource(props.disaster);
      this._map.addSource(id, footprintSource);
      this._map.addLayer(makeFootPrintLayer(props.disaster, id));
    }
    // add & hide overlay layers
    Object.keys(config.mapLayers['exposure-loss'].layers.ids).forEach((key) => {
      // add layer
      let layerIdBase = config.mapLayers['exposure-loss'].layers.ids[key];
      this._map.addLayer(makeExposureLayer(props.disaster, layerIdBase));
      // hide layer
      let layerId = `${config.mapLayers['exposure-loss'].id}-${layerIdBase}`;
      if (this._map.getLayer(layerId)) {
        this._map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
  }
  _addNavigation () {
    this._map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
  }
  componentDidMount () {
    mapboxgl.accessToken = config.mapboxApiKey;
    this._map = new mapboxgl.Map({
      container: 'analysisMap',
      style: config['disaster-data']
    });
    this._map.scrollZoom.disable();
    // remove scroll zoom
    this._addNavigation();
    this._map.fitBounds(this.props.disaster.bbox, {
      animate: false,
      padding: config.boundsPadding
    });
    // add layers, then hide them
    this._map.on('load', () => {
      this._loadLayers(this.props);
    });
    // // get layer ids matching id from current visibleLayer
    // let selectedIds = Object.keys(config.mapLayers['exposure-loss'].layers.ids)
    //   .filter((k) => {
    //     const layerRegEx = RegExp(this.props.visibleLayer.layer);
    //     const configLayer = config.mapLayers['exposure-loss'].layers.ids[k];
    //     return layerRegEx.test(configLayer);
    //   });
    // selectedIds.forEach((id) => {
    //   let layerId = `${config.mapLayers['exposure-loss'].id}-${config.mapLayers['exposure-loss'].layers.ids[id]}`;
    //   let layers = this._map.getStyle().layers;
    //   // find style layer matching current selectedIds id
    //   let layer = layers.find((l) => {
    //     return l.id === layerId;
    //   });
    //   // grab all visible layers of the opposite id group (i.e if id is admin, grab grid)
    //   let visibleLayers = getVisibleExposureLayers(layerId, layers, id);
    //   // only allow making non visible layers visible if no layers found in getVisibleExposureLayers
    //   if (layer.layout.visibility === 'none' && !visibleLayers) {
    //     this._map.setLayoutProperty(layer.id, 'visibility', 'visible');
    //   } else {
    //     this._map.setLayoutProperty(layer.id, 'visibility', 'none');
    //   }
    // });
  }
  componentWillReceiveProps (nextProps) {
    if (this.props.disaster !== nextProps.disaster) {
      this._map.fitBounds(nextProps.disaster.bbox, {
        animate: false,
        padding: config.boundsPadding
      });
    }
    // if the selected layer(s) is not visible, make it so on click
    // also make sure to only allow one layer to be visible at a time.
  
    // get layer ids matching id from current visibleLayer
    let selectedIds = Object.keys(config.mapLayers['exposure-loss'].layers.ids)
    .filter((k) => {
      const layerRegEx = RegExp(nextProps.visibleLayer.layer);
      const configLayer = config.mapLayers['exposure-loss'].layers.ids[k];
      return layerRegEx.test(configLayer);
    });
    selectedIds.forEach((id) => {
      let layerId = `${config.mapLayers['exposure-loss'].id}-${config.mapLayers['exposure-loss'].layers.ids[id]}`;
      let layers = this._map.getStyle().layers;
      // find style layer matching current selectedIds id
      let layer = this._map.getStyle().layers.find((l) => {
        return l.id === layerId;
      });
      // grab all visible layers of the opposite id group (i.e if id is admin, grab grid)
      let visibleLayers = getVisibleExposureLayers(layerId, layers, id);
      // only allow making non visible layers visible if no layers found in getVisibleExposureLayers
      if (layer.layout.visibility === 'none' && !visibleLayers) {
        this._map.setLayoutProperty(layer.id, 'visibility', 'visible');
      } else {
        this._map.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    });
    // }
  }
  render () {
    return (
      <div className='map-canvas'>
        <div className='inner'>
          <AnalysisLayerControl disaster={this.props.disaster} />
          <AnalysisMapLegend />
        </div>
        <div id='analysisMap'/>
      </div>
    );
  }
}

const selector = (state) => {
  return {
    visibleLayer: state.visibleLayer
  };
};

export default connect(selector)(AnalysisMap);
