// models.js
// Developer Reuse Metadata Profile (12 fields) implementation
// Fields:
// id, modelName, organisation, modelStatus, aiTask, inputSpecification, outputSpecification,
// architecture, trainingDataOrigin, primaryPerformanceMetric, license, accessLink, moreInformation
//
// Note: Keep text factual, technically precise, and explicit when information is missing.

window.MODELS = [
  {
    id: "model-001",
    modelName: "Land Cover Classification (Sentinel-2)",
    organisation: "Esri",
    modelStatus: "Production ready",
    aiTask: "Semantic segmentation",
    inputSpecification: "Sentinel-2 imagery, 10m, EPSG:3857.",
    outputSpecification: "Raster with CLC 2018 classes.",
    architecture: "U-Net",
    trainingDataOrigin: "CORINE Land Cover 2018.",
    primaryPerformanceMetric: "Overall accuracy 84%.",
    license: "Esri Master License Agreement",
    accessLink: "https://www.arcgis.com/home/item.html?id=afd124844ba84da69c2c533d4af10a58",
    moreInformation: "Source: Esri Living Atlas (model entry)."
  },
  {
    id: "model-002",
    modelName: "Buildings detection model",
    organisation: "Lantmäteriet",
    modelStatus: "In production",
    aiTask: "Object detection",
    inputSpecification: "The model requires true orthos and a normalised elevation model in tiff format. Input images must be of size 512x512 pixels. Orthos must be provided as a 4-channel image with 25 cm resolution.",
    outputSpecification: "The model outputs a classified raster with the same spatial resolution as the input imagery. Each pixel is assigned a value 1 or 0 (building – not building). The output preserves the input coordinate reference system.",
    architecture: "Segformer",
    trainingDataOrigin: "True orthophotos (0.25 cm) and normalised elevation model.",
    primaryPerformanceMetric: "F-score: 95%.",
    license: "Model not available for external use",
    accessLink: "N/A",
    moreInformation: "N/A"
  },
  {
    id: "model-003",
    modelName: "Road detection model",
    organisation: "Lantmäteriet",
    modelStatus: "Experimental",
    aiTask: "Object detection",
    inputSpecification: "The model requires true orthos and a normalised elevation model in tiff format. Input images must be of size 512x512 pixels. Orthos must be provided as a 4-channel image with 25 cm resolution.",
    outputSpecification: "The model outputs a classified raster with the same spatial resolution as the input imagery. Each pixel is assigned a value 1 or 0 (road – not road). The output preserves the input coordinate reference system.",
    architecture: "Segformer",
    trainingDataOrigin: "The model has been trained on true orthos from different parts of Sweden. The normalised elevation model is based on Lidar data (1 pts/sqm)",
    primaryPerformanceMetric: "F-score: 85%.",
    license: "Model not available for external use",
    accessLink: "N/A",
    moreInformation: "N/A"
  }

];
