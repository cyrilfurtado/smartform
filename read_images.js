
let tf;  // tensorflowjs module passed in for browser/node compatibility.
const Canvas = require('canvas');

async function loadImage(ctx, url){
    const img = await getImage(url)
    ctx.drawImage(img, 0, 0,224,224);
}

async function getImage(url) {
    return new Promise(r => { let i = new Canvas.Image; ; i.onload = (() => r(i)); i.src = url; });
}

function getClassId(className){
    if(className == 'chair') return	[1,0,0,0,0,0,0,0,0];
    if(className == 'chair_broken') return	[0,1,0,0,0,0,0,0,0];
    if(className == 'usb') return	[0,0,1,0,0,0,0,0,0];
    if(className == 'laptop') return	[0,0,0,1,0,0,0,0,0];
    if(className == 'headphone') return	[0,0,0,0,1,0,0,0,0];
    if(className == 'window') return	[0,0,0,0,0,1,0,0,0];
    if(className == 'window_broken') return	[0,0,0,0,0,0,1,0,0];
    if(className == 'hat_worker') return	[0,0,0,0,0,0,0,1,0];
    if(className == 'computer_mouse') return	[0,0,0,0,0,0,0,0,1];
    /*---------------------------------------------------------------------------------
	if(className == 'window_broken') return	7;
    if(className == 'fire_hydrant') return	6;
    if(className == 'fire_hydrant_broken') return	7;
    if(className == 'keyboard') return	8;
    if(className == 'monitor') return	9;
    if(className == 'mobile') return	10;
	if(className == 'pen') return	11;
	if(className == 'phone') return	12;
	
	if(className == 'switch') return	14;
	if(className == 'switch_broken') return	15;
	if(className == 'tap') return	16;
	if(className == 'tap_broken') return	17;
	if(className == 'table') return	18;
	if(className == 'thrashcan') return	19;
	if(className == 'thrashcan_broken') return	20;
	
	if(className == 'wall') return	21;
	
	if(className == 'windmill') return	24;
	if(className == 'windmill_broken') return	25;
    if(className == 'computer_mouse') return	26;
    */
    return 	[0,0,0,0,0,0,0,0];
    ;
}

class ObjectDetectionImageReader {

        constructor(canvas, tensorFlow) {
            this.canvas = canvas;
            tf = tensorFlow;
        
            // Canvas dimensions.
            this.w = this.canvas.width;
            this.h = this.canvas.height;
        }
        async getImage2(canvasimg, classid){
            const imageTensors = [];
            const targetTensors = [];
            const bb = [10,10,20,30,40];
            var c = document.getElementById("data-canvas");
            var ctx = c.getContext("2d");
            var img = document.getElementById("test_image");
            ctx.drawImage(img, 0, 0);
            const px = tf.browser.fromPixels(c);
            console.log('single img generation - getting px  '+img.src);
            imageTensors.push( px);
            console.log('data generation - load done with px '+img.src);
            targetTensors.push(tf.tensor1d(bb));
            const images = tf.stack(imageTensors);
            const targets = tf.stack(targetTensors);
            tf.dispose([imageTensors, targetTensors]);
            alert(' read image');
            return {images, targets};
        }

        async getImage(canvasimg, gallery){
            const imageTensors = [];
            const targetTensors = [];
            const bb = [10].concat([10,20,30,40]);
            var c = document.getElementById("data-canvas");
            console.log('get image from canvas ');
           // for(let i = 0; i < gallery.length; i++ ){
                //var img = document.getElementById(gallery[i]);
            var ctx = c.getContext("2d");
               // var img = gallery[i];
               // ctx.drawImage(img, 0, 0);
            const px = tf.browser.fromPixels(c);
            console.log('single img generation - getting px  '+px);
            imageTensors.push( px);
            console.log('data generation -  done  reading with px ');
            targetTensors.push(tf.tensor1d(bb));
                
           // }
            const images = tf.stack(imageTensors);
            const targets = tf.stack(targetTensors);
            tf.dispose([imageTensors, targetTensors]);
            return {images, targets};
        }
        //--- batch generation
        async generateBatch(  canvasimg ) {
            console.log('data generation');
            const csvfile = 'file://./od_9_224.csv';
            console.log('data generation - load csv');
            const csvDataset = tf.data.csv(
            csvfile, {
                hasHeader: true,
                delimiter : ","
            });
            const IMAGE_BASE_PATH = "C:/Users/Cyril-PC/ml/image_datasets_od/images/jul_06_19_img_resized/";
            // Number of features is the number of column names minus one for the label
            // column.
            const numOfFeatures = (await csvDataset.columnNames()).length - 1;
         
            //await a.forEachAsync(e => console.log(e));
            const imageTensors = [];
            const targetTensors = [];
            //const rd = csvDataset.take(1);
            let rows = await csvDataset.toArray();
            console.log('data generation - load csv - cols '+numOfFeatures+'  csvrows : '+rows.length);
            tf.util.shuffle(rows);
            
            for(let i = 0; i < rows.length; i++){
                const row = rows[i];
                console.log(row);
                
                const img_name = row['fn'];
                var ctx = canvasimg.getContext('2d');
                const clid = getClassId(row['cl']) ;
                const bb = clid.concat( [row['xmin'],row['ymin'],row['xmax'],row['ymax\r']]);
                
                console.log(i+' :------ '+img_name+' check  tensor  '+bb);
                const image_src = IMAGE_BASE_PATH+img_name;
                console.log('data generation - load file : '+image_src);
                let img = await loadImage(ctx, image_src);
                const px = tf.browser.fromPixels(canvasimg);
                console.log('data generation - getting px  '+image_src);
                imageTensors.push( px);
                console.log('data generation - load done with px '+img_name);
                targetTensors.push(tf.tensor1d(bb));
                
            // console.log('data generation - check : '+imageTensors);
            }
            const images = tf.stack(imageTensors);
            const targets = tf.stack(targetTensors);
            console.log('targets  '+targets);
            tf.dispose([imageTensors, targetTensors]);
            return {images, targets};

        }

    }

    module.exports = {ObjectDetectionImageReader};