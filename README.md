# extent-checker-app

This application helps users obtain extents or map centers, and copy the values over to a user's existing application. This will allow users to find extents they want to use for their applications in a lot less time.

![extent-checker-app](https://github.com/banuelosj/extent-checker-app/blob/main/app-screenshot.png)

## How to use the application

This application has the ability to toggle between 2D and 3D views. When switching to a 3D `SceneView`, the view parameters will include the `camera` and its parameters (`heading`, `tilt`, `fov`, and `position`);

This application has the ability to add data to the `Map` in the form of a `FeatureLayer`, and zoom to the layer's extent. This allows users to zoom to their data's extent immediatley, then modify it to fit their application's needs.
Note: Only map or feature services with a layer id can be used, as a `FeatureLayer` can only be created from either of these two service types.

A user can switch between `basemaps` using the `BasemapGallery` widget. The app includes a `Search` widget, so a user can zoom to a specific address instead of manually zooming and panning to the location.

## Built With

- [ArcGIS JavaScript API](https://developers.arcgis.com/javascript/) - Using the 4.18 JavaScript API
- [Calcite-Web](http://esri.github.io/calcite-web/documentation/)
- [Semantic-UI](https://semantic-ui.com/)

## [Live Sample](https://banuelosj.github.io/extent-checker-app/index.html)