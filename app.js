require([
  "esri/Map",
  "esri/views/MapView",
  "esri/views/SceneView",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/layers/FeatureLayer",
  "esri/geometry/support/webMercatorUtils",
  "esri/widgets/Search",
  "esri/widgets/Expand",
  "esri/widgets/BasemapGallery"
], function (
  Map, 
  MapView,
  SceneView,
  Graphic, 
  GraphicsLayer,
  FeatureLayer,
  webMercatorUtils, 
  Search, 
  Expand, 
  BasemapGallery
) {
  //ui elements
  const wgs84Div = document.getElementById('geographicExtentDiv');
  const mercatorDiv = document.getElementById('mercatorExtentDiv');
  const copyWGSBtn = document.getElementById('wgsCopyBtn');
  const copyMercBtn = document.getElementById('mercatorCopyBtn');
  const centerCopyBtn = document.getElementById('centerCopyBtn');
  const textAreaCopy = document.getElementById('copyDiv');
  const clipBoardText = document.getElementById('clipboardText');
  const clipBoardText2 = document.getElementById('clipboardText2');
  const clipBoardText3 = document.getElementById('clipboardText3');
  const viewParams = document.getElementById('viewParams');
  const centerDiv = document.getElementById('centerDiv');
  const zoomDiv = document.getElementById('zoomDiv');
  const centerBtn = document.getElementById('centerBtn');
  const addLayerForm = document.getElementById('layerInputDiv');
  const cameraDiv = document.getElementById('cameraDiv');
  const switchButton = document.getElementById("switch-btn");
  const viewSpan = document.getElementById('viewSpan');
  const addDataBtn = document.getElementById('addDataBtn');
  const addLayerInput = document.getElementById("addLayerInput");
  const addLayerBtn = document.getElementById("addLayerBtn");
  const inputError = document.getElementById('inputError');
  let is2d = true;
  let pointGraphicVisible = false;
  let centerGraphic;
  let cameraNode;
  let toggleAddDiv = false;
  let featureLayer;
  //ui elements

  var appConfig = {
    mapView: null,
    sceneView: null,
    activeView: null,
    container: "viewDiv" // use same container for views
  };

  var initialViewParams = {
    zoom: 12,
    center: [-97.0945, 32.7473],
    zoom: 16,
    container: appConfig.container
  };

  const graphicsLayer = new GraphicsLayer();

  const map = new Map({
    basemap: "streets-navigation-vector",
    ground: "world-elevation",
   // basemap: "arcgis-community", // needs valid api-key
    layers: [graphicsLayer]
  });

  // create 2D view and and set active
  appConfig.mapView = createView(initialViewParams, "2d");
  appConfig.mapView.map = map;
  appConfig.activeView = appConfig.mapView;

  // create 3D view, won't initialize until container is set
  initialViewParams.container = null;
  initialViewParams.map = map;
  appConfig.sceneView = createView(initialViewParams, "3d");

  const searchWidget2d = new Search({
    view: appConfig.mapView
  });
  const searchWidget3d = new Search({
    view: appConfig.sceneView
  });

  const basemapGallery2d = new BasemapGallery({
    view: appConfig.mapView
  });

  const basemapGallery3d = new BasemapGallery({
    view: appConfig.sceneView
  });

  const basemapExpand2d = new Expand({
    expandIconClass: "esri-icon-basemap",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
    expandTooltip: "Expand BasemapGallery", // optional, defaults to "Expand" for English locale
    view: appConfig.mapView,
    content: basemapGallery2d
  });

  const basemapExpand3d = new Expand({
    expandIconClass: "esri-icon-basemap",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
    expandTooltip: "Expand BasemapGallery", // optional, defaults to "Expand" for English locale
    view: appConfig.sceneView,
    content: basemapGallery3d
  });

  viewSpan.innerHTML = `MapView`;

  appConfig.mapView.when(()=> {
    createCenterPoint(appConfig.mapView.center);
    updateExtents(appConfig.mapView.extent, appConfig.mapView.center, appConfig.mapView.zoom); // initial load
    appConfig.mapView.watch('extent', (extent) => {
      if(!extent){
        return;
      }
      updateExtents(extent, appConfig.mapView.center, appConfig.mapView.zoom);
      // clear textarea
      textAreaCopy.innerHTML = '';
      clipBoardText.innerHTML = '';
      clipBoardText2.innerHTML = '';
      clipBoardText3.innerHTML = '';
    });

    appConfig.mapView.ui.add(searchWidget2d, 'top-left');
    appConfig.mapView.ui.add(basemapExpand2d, "top-right");
  });

  appConfig.sceneView.when(()=> {
    createCenterPoint(appConfig.sceneView.center);
    updateExtents(appConfig.sceneView.extent, appConfig.sceneView.center, appConfig.sceneView.zoom, appConfig.sceneView.camera); // initial load
    appConfig.sceneView.watch('extent', (extent) => {
      if(!extent){
        return;
      }
      updateExtents(extent, appConfig.sceneView.center, appConfig.sceneView.zoom, appConfig.sceneView.camera);
      // clear textarea
      textAreaCopy.innerHTML = '';
      clipBoardText.innerHTML = '';
      clipBoardText2.innerHTML = '';
      clipBoardText3.innerHTML = '';
    });

    appConfig.sceneView.ui.add(searchWidget3d, 'top-left');
    appConfig.sceneView.ui.add(basemapExpand3d, "top-right");
  });

  function updateExtents(extent, center, zoom, camera) {
    mercatorDiv.innerHTML = '';
    mercatorDiv.innerHTML = beautifyExtent(extent);
    // now convert to geographic from webmercator
    const wgs84Extent = webMercatorUtils.webMercatorToGeographic(extent);
    wgs84Div.innerHTML = '';
    wgs84Div.innerHTML = beautifyExtent(wgs84Extent);

    centerDiv.innerHTML = '';
    centerDiv.innerHTML = `[${center.longitude.toFixed(5)}, ${center.latitude.toFixed(5)}]`;

    zoomDiv.innerHTML = '';
    zoomDiv.innerHTML = `${zoom.toFixed(0)}`;

    if(!is2d) {
      updateCamera(camera);
    }

    updateCenterPoint(center);
  }

  function beautifyExtent(extent) {
    const extentString = `
      <b>xmin:</b> ${extent.xmin},<br />
      <b>ymin:</b> ${extent.ymin},<br />
      <b>xmax:</b> ${extent.xmax},<br />
      <b>ymax:</b> ${extent.ymax},<br />
      <b>spatialReference:</b> ${extent.spatialReference.wkid}
    `;
    return extentString;
  }

  copyMercBtn.onclick = function(){copyToClipboard('wm')};
  copyWGSBtn.onclick = function(){copyToClipboard('wgs')};
  centerCopyBtn.onclick = function(){copyToClipboard('center')};
  centerBtn.onclick = function(){toggleCenterPoint(!pointGraphicVisible)};
  switchButton.onclick = function(){switchView()};
  addLayerBtn.onclick = function(){addLayer(addLayerInput.value)};
  addDataBtn.onclick = function(){toggleAddLayer(!toggleAddDiv)};

  addLayerInput.addEventListener('change', (event) => {
    hideInputError();
  });

  function copyToClipboard(sr) {
    if(sr === 'wm') {
      textAreaCopy.innerHTML = `{${mercatorDiv.innerText}}`;
      clipBoardText2.innerHTML = "copied to clipboard"
    } else if(sr === 'wgs') {
      textAreaCopy.innerHTML = `{${wgs84Div.innerText}}`;
      clipBoardText.innerHTML = "copied to clipboard"
    } else if (sr === 'center') {
      textAreaCopy.innerHTML = viewParams.innerText;
      clipBoardText3.innerHTML = "copied to clipboard";
    }
    
    try {
      textAreaCopy.select();
      document.execCommand('copy');
      
    } catch (err) {
      console.log('Oops, unable to copy');
    }
  }

  function createCenterPoint(center) {
    graphicsLayer.removeAll();

    centerGraphic = new Graphic({
      geometry: center,
      symbol: {
        type: "simple-marker",
        color: "#60C5E4",
        outline: {
          color: [0, 0, 0],
          width: 2
        }
      }
    });

    graphicsLayer.add(centerGraphic);
    centerGraphic.visible = false;
  }

  function updateCenterPoint(center) {
    let point = {
      type: "point",
      longitude: center.longitude,
      latitude: center.latitude
    }
    centerGraphic.geometry = point;
  }

  function toggleCenterPoint(togglePoint) {
    if(togglePoint){
      centerGraphic.visible = true;
    } else {
      centerGraphic.visible = false;
    }
    pointGraphicVisible = !pointGraphicVisible;
  }

  function updateCamera(camera) {
     const cameraString = `&ensp;camera: {<br />
      &ensp;&ensp;heading: ${camera.heading},<br />
      &ensp;&ensp;tilt: ${camera.tilt},<br />
      &ensp;&ensp;fov: ${camera.fov},<br />
      &ensp;&ensp;position: [<br />
      &ensp;&ensp;&ensp;${camera.position.longitude},<br />
      &ensp;&ensp;&ensp;${camera.position.latitude},<br />
      &ensp;&ensp;&ensp;${camera.position.z}<br />
      &ensp;&ensp;]<br />
      &ensp;}
    `;
    cameraNode.innerHTML = cameraString;
  }

  function switchView() {
    var is3D = appConfig.activeView.type === "3d";
    var activeViewpoint = appConfig.activeView.viewpoint.clone();

    // remove the reference to the container for the previous view
    appConfig.activeView.container = null;

    if (is3D) {
      is2d = true;
      viewSpan.innerHTML = `MapView`;
      document.getElementById('trailingComma').style.visibility = "hidden";
      cameraDiv.removeChild(cameraDiv.childNodes[0]);
      //cameraDiv.style.visibility = "hidden";
      // if the input view is a SceneView, set the viewpoint on the
      // mapView instance. Set the container on the mapView and flag
      // it as the active view
      appConfig.mapView.viewpoint = activeViewpoint;
      appConfig.mapView.container = appConfig.container;
      appConfig.activeView = appConfig.mapView;
      switchButton.value = "3D";
    } else {
      is2d = false;
      viewSpan.innerHTML = `SceneView`;
      document.getElementById('trailingComma').style.visibility = "visible";
      cameraNode = document.createElement("div");
      cameraDiv.appendChild(cameraNode);
      //cameraDiv.style.visibility = "visible";
      appConfig.sceneView.viewpoint = activeViewpoint;
      appConfig.sceneView.container = appConfig.container;
      appConfig.activeView = appConfig.sceneView;
      switchButton.value = "2D";
    }
  }

  function createView(params, type) {
    var view;
    var is2D = type === "2d";
    if (is2D) {
      view = new MapView(params);
      return view;
    } else {
      view = new SceneView(params);
    }
    return view;
  }

  function addLayer(url) {
    let view = is2d ? appConfig.mapView : appConfig.sceneView;
    
    try {
      new URL(url);
      // validating url using regex

      var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
      var regex = new RegExp(expression);
      if(!url.match(regex)) {
        showInputError('Not a valid url');
        return;
      }
      // service should only be map or feature service
      if(url.includes('MapServer/') || url.includes('FeatureServer/')){
      } else {
        // set invalid on input
        showInputError('Url does not contain a map or feature service with a layer id');
        return;
      }
    } catch(e) {
      showInputError('Not a valid url');
      return;
    }
    
    try {
      // remove existing layer
      view.map.remove(featureLayer);
      featureLayer = new FeatureLayer({
        url: url
      });
      view.map.add(featureLayer);
      featureLayer.when(() => {
        view.goTo(featureLayer.fullExtent);
      });
    } catch(err) {
      console.log('failed to add featureLayer: ', err);
    } 
  }

  function showInputError(message) {
    addLayerInput.classList.add('input-error');
    inputError.classList.add('is-active');
    inputError.innerHTML = `${message}`;
  }

  function hideInputError() {
    addLayerInput.classList.remove('input-error');
    inputError.classList.remove('is-active');
  }

  function toggleAddLayer(toggle) {
    if(toggle) {
      // display layerInputDiv
      addLayerForm.style.visibility = "visible";
      toggleAddDiv = true;
      addDataBtn.classList.remove('esri-icon-upload');
      addDataBtn.classList.add('esri-icon-up-arrow');
    } else {
      // hide layerInputDiv
      addLayerForm.style.visibility = "hidden";
      toggleAddDiv = false;
      addDataBtn.classList.remove('esri-icon-up-arrow');
      addDataBtn.classList.add('esri-icon-upload');
    }
  }

});