# agsnode
ArcGIS Server and Node to create features

Usage:
 Start a Command Prompt and cd to local repository
 npm install
 node main

 Data Setup:
   ArcGIS
   Load AGSNODEPOINTS.xml as a Featureclass into your enterprise Geodatabase
   Load AGSNODEPOLYGONS.xml as a Featureclass into your enterprise Geodatabase
   Open AGSNode.mxd and re-train the datasources
   Publish this updated mxd as a FeatureService
   Update the URLs in main.js to point to your FeatureService and GeometryServer
   

   
