
import * as tf from '@tensorflow/tfjs';
import {ObjectDetectionImageReader} from './read_images';

const canvas = document.getElementById('data-canvas');
const status = document.getElementById('status');
const inferenceTimeMs = document.getElementById('inference-time-ms');
const predictedObjectClass = document.getElementById('predicted-object-class');

const TRUE_BOUNDING_BOX_LINE_WIDTH = 2;
const TRUE_BOUNDING_BOX_STYLE = 'rgb(255,0,0)';
const PREDICT_BOUNDING_BOX_LINE_WIDTH = 2;
const PREDICT_BOUNDING_BOX_STYLE = 'rgb(0,0,255)';
const CANVAS_SIZE = 224;

  function drawBoundingBoxes(canvas,  predictBoundingBox) {
  
      tf.util.assert(
          predictBoundingBox != null && predictBoundingBox.length === 4,
          `Expected boundingBoxArray to have length 4, ` +
              `but got ${predictBoundingBox} instead`);
    
      const ctx = canvas.getContext('2d');

    let leftcont = 0;
    let topcont = 0;
    let left = Math.round(predictBoundingBox[0]);
    let right = Math.round(predictBoundingBox[2]);
    let top = Math.round(predictBoundingBox[1]);
    let bottom = Math.round(predictBoundingBox[3]);
    if(left < 0)
        leftcont = 0 - leftcont;
    if(top < 0)
        topcont = 0 - topcont;
    left += leftcont; right += leftcont;
    top += topcont; bottom += topcont;

    console.log('bounding box : '+left+','+right)
      ctx.beginPath(); 
      ctx.strokeStyle = PREDICT_BOUNDING_BOX_STYLE;
      ctx.lineWidth = PREDICT_BOUNDING_BOX_LINE_WIDTH;
      ctx.moveTo(left, top);
      ctx.lineTo(right, top);
      ctx.lineTo(right, bottom);
      ctx.lineTo(left, bottom);
      ctx.lineTo(left, top);
      ctx.stroke();

      ctx.font = '15px Arial';
      ctx.fillStyle = PREDICT_BOUNDING_BOX_STYLE;
    // lets return the boxes
        const w = right - left;
        const h = bottom - top;
      let rect = {"type":"rectangle","color":"blue","x":left,"y":right,"width":w,"height":h,"file_id":0,"scaled":1,"page_num":1};
      
      return rect;
  }

  function cropImage(img) {
    const width = img.shape[0];
    const height = img.shape[1];

    // use the shorter side as the size to which we will crop
    const shorterSide = Math.min(img.shape[0], img.shape[1]);

    // calculate beginning and ending crop points
    const startingHeight = (height - shorterSide) / 2;
    const startingWidth = (width - shorterSide) / 2;
    const endingHeight = startingHeight + shorterSide;
    const endingWidth = startingWidth + shorterSide;

    // return image data cropped to those points
    return img.slice([startingWidth, startingHeight, 0], [endingWidth, endingHeight, 3]);
  }

  function resizeImage(image) {
    return tf.image.resizeBilinear(image, [CANVAS_SIZE, CANVAS_SIZE]);
  }
/**
 * check an input image, run inference on it and visualize the results.
 *
 * @param {tf.Model} model Model to be used for inference.
 */
  function getClassName(clid){
   
   
    let det = {"usrEquipmentDP":"Office", "usrSRSubCatPD":"room" , "upmEqpTypePD":"", "upmEqpName":"", "NCR_IssueDesc_Eng_txt":"", "NCR_IssueDesc_Eng_txt":"", 
               "uuu_user_firstname":"","usrServiceCategoryPD":"", "usrSRTitle"  :"","uRequesterDP":"" , "annotation":{}  };
    
    console.log('Class ---** '+clid +'  ::');
    if(clid   == 0){// chair
      det["upmEqpTypePD"]="furniture";
      det["upmEqpName"]="Chair";
      det["NCR_IssueDesc_Eng_txt"]="office chair needs cleaning";
      det["usrServiceCategoryPD"]="cleaning";
      det["usrSRTitle"]="Furniture cleaning";
      return det;
    }
    if(clid ==1){//Chair brok
      det["upmEqpTypePD"]="furniture";
      det["upmEqpName"]="Chair B"; 
      det["NCR_IssueDesc_Eng_txt"]="office chair needs repairs";
      det["usrServiceCategoryPD"]="repair";
      det["usrSRTitle"]="Furniture fixing";
      return det;
    }
    if(clid==2){//usb
      det["usrSRSubCatPD"]="Laptop";
      det["upmEqpTypePD"]="Elctronics";
      det["upmEqpName"]="USB";
      det["NCR_IssueDesc_Eng_txt"]="Need USB cable to connect devices like phone";
      det["usrServiceCategoryPD"]="devices";
      det["usrSRTitle"]="USB requsition";
      return det;
    }
    if(clid == 3){//laptop
      det["usrSRSubCatPD"]="hardware";
      det["upmEqpTypePD"]="Computer";
      det["upmEqpName"]="Laptop";
      det["NCR_IssueDesc_Eng_txt"]="Need a new laptop for work";
      det["usrServiceCategoryPD"]="equipment";
      det["usrSRTitle"]="Laptop requisition";
      return det;
    }
    if(clid ==4){// head ph
      det["usrSRSubCatPD"]="cube";
      det["upmEqpTypePD"]="Electronics";
      det["upmEqpName"]="Head Phones";
      det["NCR_IssueDesc_Eng_txt"]="Need head phones ";
      det["usrServiceCategoryPD"]="devices";
      det["usrSRTitle"]="Head phone requisition";
      return det;
    }
   
    if(clid == 5){
      det["upmEqpTypePD"]="furniture";
      det["upmEqpName"]="Window";
      det["NCR_IssueDesc_Eng_txt"]="office window needs cleaning, glass is dirty & window panes need cleaning";
      det["usrServiceCategoryPD"]="cleaning";
      det["usrSRTitle"]="Furniture cleaning";
      return det;
    }
   if(clid == 6){
      det["upmEqpTypePD"]="furniture";
      det["upmEqpName"]="Window Broken";
      det["NCR_IssueDesc_Eng_txt"]="office room winows needs glass repairs";
      det["usrServiceCategoryPD"]="repair";
      det["usrSRTitle"]="Furniture window glass fixing";
      return det;
    } 
   /* if(clid >= (val*6 + cv) && clid < (val*7 + cv)){
      det["usrSRSubCatPD"]="building";
      det["upmEqpTypePD"]="construction";
      det["upmEqpName"]="Pipe";
      det["NCR_IssueDesc_Eng_txt"]="Order for Pipes ";
      det["usrServiceCategoryPD"]="material";
      det["usrSRTitle"]="Create a requsition for pipe purchases ";
      return det;
    } */   
    if(clid == 7) {
      det["upmEqpTypePD"]="Worker";
      det["upmEqpName"]="Construction Worker";
      det["NCR_IssueDesc_Eng_txt"]="Worker uniforms need ordering";
      det["usrServiceCategoryPD"]="Labor";
      det["usrSRTitle"]="Requsition for worker uniforms";
      return det;
    }
    if(clid == 8) {
      det["upmEqpTypePD"]="Worker";
      det["upmEqpName"]="Computer Mouse";
      det["NCR_IssueDesc_Eng_txt"]="Worker uniforms need ordering";
      det["usrServiceCategoryPD"]="Labor";
      det["usrSRTitle"]="Requsition for worker uniforms";
      return det;
    } 
    return det;
    
  }

  async function runAndVisualizeInference(model, imgs) {
    // get an input image and show it in the canvas.
    const reader = new ObjectDetectionImageReader(canvas, tf);

    
    //const {images, targets} = await reader.getImage2(canvas, imgs);
    const {images, targets} = await reader.getImage(canvas, imgs);
    const t0 = tf.util.now();
    // Runs inference with the model.
    const predicted = await model.predict(images);
    predicted.print();
    const modelOut = await predicted.data();
    inferenceTimeMs.textContent = `${(tf.util.now() - t0).toFixed(1)}`;
    console.log('prediction --====- :'+modelOut);
    let maxVal = -100;
    let maxIndex = -1;
    for(let i = 0; i < 9; i++ ){
      console.log(i+' :: '+modelOut[i]);
      if(modelOut[i] > maxVal){
        maxVal = modelOut[i];
        maxIndex = i;
      }
           
    }
    console.log(maxIndex+' ---final--:: '+maxVal);
    // Visualize the true and predicted bounding boxes.
     const boxes = drawBoundingBoxes(canvas, modelOut.slice(9));
   
   
    const itemDetails = getClassName(maxIndex);//      (modelOut[0] > shapeClassificationThreshold) ? 'rectangle' : 'triangle';
    predictedObjectClass.textContent = itemDetails.upmEqpName;
    itemDetails["annotation"] = boxes;
    // Tensor memory cleanup.
    tf.dispose([images, targets]);
  }

  async function init() {
    const LOCAL_MODEL_PATH = 'object_detection_model/model.json';
    
    // "Load local model" button.
    let model;
    try {
      model = await tf.loadLayersModel(LOCAL_MODEL_PATH);
      model.summary();
      //testModel.disabled = false;
      status.textContent = 'Loaded trained model! Now  "Choose files".';
      //runAndVisualizeInference(model);
    } catch (err) {
         status.textContent = 'Failed to load locally-saved model. ' ;
    }

    var uploadfiles = document.querySelector('#fileinput');
    uploadfiles.addEventListener('change', function () {
      var files = this.files;
      let imgs = [];
      for(var i=0; i<files.length; i++){
          const img = previewImage(this.files[i],i);
          if(img)
            imgs.push('img_file_'+i);
      }

    }, false);

    function previewImage(file,id) {
      var galleryId = "gallery";
  
      var gallery = document.getElementById(galleryId);
      var imageType = /image.*/;
  
      if (!file.type.match(imageType)) {
          console.log("File Type must be an image :"+file);
          return;
      }
  
      var thumb = document.createElement("div");
      thumb.classList.add('thumbnail'); // Add the class thumbnail to the created div
  /*
      var img = document.createElement("img");
      img.file = file;
      img.id = 'img_file_'+id;
      thumb.appendChild(img);
      gallery.appendChild(thumb);
  */
      // Using FileReader to display the image content
      var reader = new FileReader();
    /*  reader.onload = (function(aImg) { return function(e) { 
                                            aImg.src = e.target.result;        };
                                      })(img); */
      reader.onloadend = function(event){
        console.log ('image loading');
        var img = new Image();
        img.onload = function(ev ){
          var c = document.getElementById("data-canvas");
          var ctx = c.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(ev.target, 0, 0);
          console.log ('image canvas');
          runAndVisualizeInference(model,[]);
        }
        img.src = event.target.result;
      }                                
      reader.readAsDataURL(file);
      return 'img_file_'+id;
    }

  }

init();
