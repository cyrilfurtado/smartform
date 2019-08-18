 define(['ojs/ojcore',
	'knockout',
	'jquery',
	'../../modules/comp/bindings',
	'ojs/ojknockout',
	'../../modules/comp/log/loader',
	'ojs/ojknockout',
	'ojs/ojslider'
	],
	function(oj, ko, $, bindings) {

	function UserProfileImage() {

		var ifilter = "jpg,jpeg,png,tiff";
		var self = this;
		var existingProfileImageId, existingProfileImageSig, isSiteAdmin, displayAvatar;
		self.imageName = ko.observable("");
		self.profileImageAvlble = ko.observable(false);
		self.imageWidth = '150px';
		self.imageHeight = '150px';
		self.dragPanelLoading = U.translate("Loading...");
		self.max = ko.observable(100);
        self.min = ko.observable(10);
        self.value = ko.observable(10);
        self.step = ko.observable(10);
        var scale = 1.0;
		var scaleMultiplier = 0.6;
		var startDragOffset = {};
		var mouseDown = false;
		var translatePos;
		var imageDeleted = false;

		var currentzoomLevel = self.value();

		self.isDraggingOver = ko.observable(false);

		self.init = function(P) {
			self.profileImageId = P.profileImageId;
			existingProfileImageId = P.profileImageId;
			self.profileImageSig = P.profileImageSig;
			existingProfileImageSig = P.profileImageSig;
			self.imageName(P.imageName);
			self.profileImageAvlble(P.profileImageId != "0");
			isSiteAdmin = P.isSiteAdmin;
			displayAvatar = P.displayAvatar;

			var canvas = document.getElementById("imageCanvas");
			translatePos = {
					x: canvas.width / 2,
					y: canvas.height / 2
			};


			if(self.profileImageAvlble()){
				draw(scale);
				document.getElementById("imageSelect").style.display="none";
				document.getElementById("imageName").style.display="block";
			} else{
				drawEmptyCanvasImage();
				document.getElementById("imageSelect").style.display="block";
				document.getElementById("imageName").style.display="none";
			}
		}

		self.dragover = function(m, e) {
			e.preventDefault();
			e.stopPropagation();
			self.isDraggingOver(true);
		}

		self.dragleave = function(m, e) {
			e.preventDefault();
			e.stopPropagation();
			self.isDraggingOver(false);
		}

		self.drop = function(m, e) {
			self.isDraggingOver(false);
			var dataTransfer =  e.originalEvent.dataTransfer;
			if( dataTransfer && dataTransfer.files.length) {
				e.preventDefault();
				e.stopPropagation();
				self.verify(self, e, dataTransfer.files);
			}
		}

		self.underlineText = function(){
			$("#selectImageUnderLine").css('text-decoration', 'underline');
		}

		self.removeUnderlineText = function(){
			$("#selectImageUnderLine").css('text-decoration', 'none');
		}

		self.addImage = function(event){
			var element = $("#myImage");
			$("input[type=file]", element).click();
		}

		self.verify = function(imgField, e, files){
			var fileList;
			if (files) {
				fileList = files;
			}
			else {
				fileList = e.currentTarget.files;
			}
			if (fileList.length !== 1) return;
			var file = fileList[0];
			if(matchedFilter(file.name))
				sendDMFile(file);
			else{
				U.AlertByKey("Not a valid file format");
				return;
			}

		}
		function matchedFilter(fileName){
			var allFilter = ifilter.split(",");
			var lInd = fileName.lastIndexOf(".");
			if (lInd <= 0 || fileName.length <= lInd + 1) {
				return false;
			}
			var fileExt = fileName.substring(lInd + 1).toLowerCase();
			for(var i=0;i<allFilter.length;i++) {
				var filterExt = allFilter[i]; // .substring(allFilter[i].lastIndexOf("."))
				if(fileExt == filterExt.toLowerCase())
					return true;
			}
			return false;
		}
		self.zoomImage = function(){

			if(currentzoomLevel < self.value()){
				var multipler = scaleMultiplier * self.value()/10;
				scale *= multipler;
				draw(scale);
				currentzoomLevel = self.value();
			} else if(currentzoomLevel > self.value()) {
				var divider = scaleMultiplier * self.value()/10;
				scale /= divider;
				draw(scale);
				currentzoomLevel = self.value();
			}

		}

		var buildParameters = function() {
    		// The following are required:
    		var params = {};
    		var picker_name = "filepicker2";
    		var upload_type = "files";
    		var file_type = "dms";
    		var creator_id = null;
    		var project_id = 1215;//P.projectId;
    		var projectcompany_id = null;
    		var single = "yes";
    		var filter = ifilter;
    		var return_target = null;

    		// The following are not required for file upload/maybe for doc upload?
    		var content_source = null;
    		var from_object_type = "folder";
    		var from_object_id = 3662;
    		var from_object_name = "Service Req";
    		var from_folder_path = "/";
    		var revisenodeids = null;
    		var nodefiles = null;
    		var from_object_type_2 = null;
    		var from_object_id_2 = null;
    		var from_fileids = null;
    		var stream = null;
    		var get_contents = null;
    		var budget_id = null;
    		var duplicatecheck = null;
    		var postcomplete = null;
    		var emailtarget = null;
    		var xrefdata = null;
    		var selectFileName = null;
    		var refreshOpener = true;
    		var maxsize = 1048576;
    		var ojetHomePageObject = null;
    		var searchType = null;

    		params["picker_name"] =(picker_name==null?'':picker_name);
    		if(content_source !=null)
    			params["content_source"]=(content_source==null?'':content_source);
    		if(upload_type !=null)
    			params["upload_type"]=(upload_type==null?'':upload_type);
    		if(file_type!=null)
    			params["file_type"]=(file_type==null?'':file_type);
    		params["from_object_type"]=(from_object_type==null?'':from_object_type);
    		params["from_object_id"]=(from_object_id==null?'':from_object_id);
    		params["from_object_name"]=(from_object_name==null?'':from_object_name);
    		params["from_folder_path"]=(from_folder_path==null?'':from_folder_path);
    		params["revisenodeids"]=(revisenodeids==null?'':revisenodeids);
    		params["nodefiles"]=(nodefiles==null?'':nodefiles);
    		if(creator_id !=null)
    			params["creator_id"]=(creator_id==null?'':creator_id);
    		if(project_id !=null)
    			params["project_id"]=(project_id==null?'':project_id);
    		if(projectcompany_id !=null)
    			params["projectcompany_id"]=(projectcompany_id==null?'':projectcompany_id);
    		params["from_object_type_2"]=(from_object_type_2==null?'':from_object_type_2);
    		params["from_object_id_2"]=(from_object_id_2==null?'':from_object_id_2);
    		params["from_fileids"]=(from_fileids==null?'':from_fileids);
    		if(single !=null)
    			params["single"]=(single==null?'':single);
    		if(filter !=null)
    			params["filter"]=(filter==null?'':filter);
    		if(stream !=null)
    			params["stream"]=(stream==null?'':stream);
    		if(get_contents !=null)
    			params["get_contents"]=(get_contents==null?'':get_contents);
    		params["return_target"]=(return_target==null?'': U.urefSearch(return_target)) ;
    		params["budget_id"]=(budget_id==null?'':budget_id);
    		params["duplicatecheck"]=duplicatecheck;
    		params["postcomplete"]=(postcomplete==null?'':postcomplete);
    		params["emailtarget"]=(emailtarget==null?'':emailtarget);
    		params["xrefdata"]=(xrefdata==null?'':xrefdata);
    		params["selectFileName"]=(selectFileName==null?'':selectFileName);
    		params["refreshOpener"]=(refreshOpener==null?'':refreshOpener);
    		params["maxsize"]=(maxsize==null?'':maxsize);
    		params["__token"]=U.token;
            params["ojetHomePageObject"]=ojetHomePageObject;
            params["searchType"]=searchType;
            return params;
    	}
		var sendDMFile = function(file) {

			var url = U.appendRoot("/bp/sys/dm/new/upload?__uref="+U.uref);
			var fd = new FormData();
			var params = buildParameters();
			params["filesize"]=file.size;
			params["__token"] = U.token;
			params["__uref"] = U.uref;
			fd.append('params',JSON.stringify(params));
			var fileMetaDataArr = [];
            var fileInfo = {id: 0, fileName: file.name, docTitle: "",
                                    fileNameHidden: file.name, parentId: 0,
                                    fileSize:file.size};
                            fileMetaDataArr.push(fileInfo);
            fd.append('fileMetaDataArr[]', JSON.stringify(fileMetaDataArr));
			fd.append('0', file);

			$.ajax({
				url         : url,
				data        : fd,
				cache       : false,
				contentType : false,
				processData : false,
				type        : 'POST',
				success     : function(rs, textStatus, jqXHR) {
					var resp = rs.returnError;
					if (resp.error == "yes" && resp.errormsg !="") {
						U.Validation(resp.errormsg);
					}
					else if (resp.uploadedfiles && resp.uploadedfiles.length >= 1) {
						var fl = resp.uploadedfiles[0];
						self.profileImageId = fl.id;
						var sig = resp.signature;
						self.profileImageSig = sig[self.profileImageId];
						self.imageName(fl.file_name + " file id: " + fl.id);
						draw(scale);
						document.getElementById("imageSelect").style.display="none";
						document.getElementById("imageName").style.display="block";
						//
						processFile(fl,resp);
					}
				},
				error		: function(jqxhr, textStatus, errorMessage) {
					self.dragText(self.dragPanelText);
					U.Validation(errormsg);
				}
			});
		}
		
		var processFile = function(fl,resp) {
			self.profileImageId = fl.id;
			var sig = resp.signature;
			self.profileImageSig = sig[self.profileImageId];
			/*self.imageName(fl.file_name + " file id: " + fl.id);
			draw(scale);
			document.getElementById("image_del_button").style.display = "block";
			document.getElementById("imageSelect").style.display="none";
			document.getElementById("imageName").style.display="block";*/
			//var img = new Image();//$('<img />', { id: 'profileImage', width: 360, height:360});
			//img.src = U.appendRoot("/bp/file/getImageFile?id="+self.profileImageId+"&sig="+self.profileImageSig);
				
			//img.onload = function(){
					// do work here
					
			//}
			var module= "uxsrq";
			var no_workflow=false;
			var wf_id=3452;
			console.log(fl);
			var json = {
				usrSRTitle: "Title is Title",
				uuu_user_lastname: "Jackson",
				uuu_user_firstname: "Michael",
				/*usrSRother: "",
				usrEquipmentDP: ,
				usrAddAssetDetailsTB500: ,
				usrSRSubCatPD: ,
				upmEqpTypePD: ,
				upmEqpName: "",
				uworEmergencyPD: ,
				NCR_IssueDesc_Eng_txt: "",
				usrServiceCategoryPD: ,
				uRequesterDP: ,*/
				file_id: fl.id,
				comment: "Test Comment for File",
				annotations: ""
			};
			//self.invokeCreateNewProcess(module,pid,no_workflow,wf_id, fl.doc_id
			window.opener.invokeRecord(module,no_workflow,wf_id, fl.doc_id, json);
		}

		var drawEmptyCanvasImage = function(){
			var canvas = document.getElementById("imageCanvas");
			var context = canvas.getContext("2d");

			context.clearRect(0, 0, canvas.width, canvas.height);
			context.restore();
			context.save();
			context.translate(canvas.width / 2, canvas.height / 2);
			context.scale(scale, scale);

			context.fillStyle = "black";
			context.globalAlpha = 0.3;
			context.fillRect(-180,-180, 360, 360);
			context.strokeStyle = "black";
			context.stroke();
			context.restore();

			var circlecnvs = document.getElementById("imageCanvas");
			var circlectx = circlecnvs.getContext("2d");
			circlectx.arc(180,180,180,0,2*Math.PI);
			circlectx.lineWidth = 1;
			circlectx.strokeStyle = "black";
			circlectx.stroke();

			circlectx.fillStyle = "white";
			circlectx.globalAlpha = 1;
			circlectx.fill();
		}
		var draw = function(scale){
			var canvas = document.getElementById("imageCanvas");
			var context = canvas.getContext("2d");


			context.clearRect(0, 0, canvas.width, canvas.height);
			context.restore();

			context.save();
			context.translate(canvas.width / 2, canvas.height / 2);
			context.scale(scale, scale);

			context.beginPath(); // begin custom shape
			if(self.profileImageId !=0){
				var img = new Image();//$('<img />', { id: 'profileImage', width: 360, height:360});
				if(isSiteAdmin) {
					img.src  = U.appendRoot("/bp/file/getImageFileContent?id="+self.profileImageId+"&sig="+self.profileImageSig);
				} else{
					img.src = U.appendRoot("/bp/file/getImageFile?id="+self.profileImageId+"&sig="+self.profileImageSig);
				}
				img.onload = function(){
					context.drawImage(img, -180, -180, 360, 360);
					img.style.display = "block";

//					var circlectx = canvas.getContext("2d");
//					circlectx.arc(0,0,180,0,2*Math.PI);
//					circlectx.lineWidth = 1;
//					circlectx.strokeStyle = "black";
//					circlectx.stroke();
				}
			}
			context.closePath(); // complete custom shape

		}

		self.uploadImage = function(){
			if(self.profileImageId == 0) {
				existingProfileImageId = self.profileImageId;
				existingProfileImageSig = self.profileImageSig;
				self.deleteImage();
				imageDeleted = false;
				return;
			}
			var url = "/bp/mod/preferences/uploadImage";
			var params = {};
			params["profileImageId"] = self.profileImageId;

			U.call(url, params, function(response){
				displayAvatar(self.profileImageId,self.profileImageSig);
				U.Event.publish('imageDialog_close', {});

			});
		};

		self.cancel = function(){
			U.Event.publish('imageDialog_close', {});
			if(imageDeleted){
				self.profileImageId = existingProfileImageId;
				self.profileImageSig = existingProfileImageSig;
				document.getElementById("imageSelect").style.display="none";
				document.getElementById("imageName").style.display="block";
				document.getElementById("image_del_button").style.display="block";
				draw(scale);
			}
		};

		self.deleteProfileImage = function(){
			existingProfileImageId = self.profileImageId;
			existingProfileImageSig = self.profileImageSig;
			self.profileImageId = 0;
			var canvas = document.getElementById("imageCanvas");
			var context = canvas.getContext("2d");
			context.clearRect(-180, -180, 360, 360);
			context.restore();
			document.getElementById("imageSelect").style.display="block";
			document.getElementById("imageName").style.display="none";
			document.getElementById("image_del_button").style.display="none";
			drawEmptyCanvasImage();
			imageDeleted = true;
		}

		self.deleteImage = function(){
			var url = "/bp/mod/preferences/deleteImage";
			var params = {};
			U.call(url, params, function(response){
				var imageObj = document.getElementById("profileImage");
				displayAvatar(self.profileImageId,self.profileImageSig);
				U.Event.publish('imageDialog_close', {});
			});
		}
	}

	return UserProfileImage;
});
