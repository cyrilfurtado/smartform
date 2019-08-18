'use strict';
define(['jquery', 'knockout', 'ojs/ojcore', '../../comp/record/base', 'studio/FilePickerControl', 'webant/autovue'],
	function ($, ko, oj, base) {
		function attachmentModel(context) {
			var self = this;
			self.dataLength = ko.observable(0);
			self.isTreeBuilt = ko.observable(0);
			self.toAttachFromDM = ko.observableArray([]);
			self.universalR = ko.observableArray([]);
			self.universalS = ko.observableArray([]);
			self.universalT = ko.observableArray([]);
			self.hasAttachments = ko.observable(false);
			//self.isProxy = ko.observable(false);
			self.canSign = ko.observable(true);
			self.hasUF = ko.observable(false);
			self.hasMC = ko.observable(false);
			self.hasReferences = ko.observable(false);
			self.hasEsignDocs = ko.observable(false);
			self.hasCP = ko.observable(false);
			self.canRemove = ko.observable(false);
			self.subscribedHeight = ko.observable(0);
			self.attachmentID = ko.observable(0);
			self.attachCount = ko.observable(0);
			// self.callSilentSave = ko.observable(1);
			self.no_attachments = ko.observable(U.translateMessage("no_attachments"));
			self.no_attachments_preview = ko.observable(U.translateMessage("no_attachments_preview"));
			self.isLineItem = ko.observable(false);
			self.isRecord = ko.observable(false);
			self.isReadOnly = ko.observable(false);
			self.datalengthRevRef = ko.observable(0);
			self.warning_info = ko.observable(U.translate("Information"));
			self.isAutoVueEnabled = ko.observable(false);
			self.toggleExpand = ko.observable(false);
			// self.listOfFileIds = ko.observable();
			self.previewUrl = ko.observable(" ");
			self.myUiViewer;
			self.canRepublish = ko.observable(false);

			var element = context.element;
			var fromLI = false;
			var attachRevRefGridStore;
			var attachmentGridDM;
			var attachmentGridDMStore;
			var rowDataAll = [];
			var parentFolderMap = {};
			var gridContainer;
			var gridContainerRevRef;
			var attachmentNode;
			var contextRecID;
			var contextTaskID;
			var contextModel;
			var contextPid;
			var selectedFileName;
			var selectedFileID;
			var postCompleteURL;
			var dupCheckURL;
			var attachmentURL;
			var postCompleteURLLineitem;
			var dupCheckURLLineitem;
			var sessionBean;
			var serverUrl;
			var internalServerEnabled;
			var viewertype;
			var registryprefix;
			var model_type;
			var model_id_1;
			var parent_rank;
			var srcType;
			var no_task;
			var sourceId = 0;
			var sourceType;
			var detailInfoParams;
			var detailInfoStatusMap;
			var detailInfoDataBean;
			// self.customPrintView = new U.CustomPrint();
			self.attachmentGridData = [];

			context.props.then(function (properties) {
				var props = properties;
			});

			var dataFields = [{
					tooltip: U.translate("Publish to Document Manager"),
					name: "check_icon",
					title: "<i class='pgbu-bluesky-icon pgbu-icon-publish-projects'></i>",
					width: 65,
					sortable: false,
					hideable: false,
					menu: false,
					resizable: true,
					draggable: false,
					align: 'center',
					displayType: 'check',
					rendererFns: {
						getValueMarkup: function (options) {
							if (self.isReadOnly() == true) {
								if (options.record.publish == 0) {
									return $CheckedIconNoTrigger.attr("id", "check_" + options.record.id)[0].outerHTML;
								} else {
									return $UncheckedIconNoTrigger.attr("id", "check_" + options.record.id)[0].outerHTML;
								}
							} else if (self.isReadOnly() == false) {
								if (options.record.publish == 0) {
									if (options.record.publication_no > 0) {
										if (self.canRepublish()) {
											return $UncheckedIconRepublish.attr("id", "check_" + options.record.id)[0].outerHTML;
										} else {
											return $CheckedIconNoTrigger.attr("id", "check_" + options.record.id)[0].outerHTML;
										}
									} else
										return $CheckedIcon.attr("id", "check_" + options.record.id)[0].outerHTML;
								} else {
									if (options.record.publication_no > 0) {
										if (self.canRepublish()) {
											return $CheckedIconRepublish.attr("id", "check_" + options.record.id)[0].outerHTML;
										} else {
											return $CheckedIconNoTrigger.attr("id", "check_" + options.record.id)[0].outerHTML;
										}
									} else
										return $UncheckedIcon.attr("id", "check_" + options.record.id)[0].outerHTML;
								}
							}
						},
						getAttributes: function (renderOptions) {
							return ' title="" ';
						}
					}
				},
				{
					name: "esign_status",
					title: "<i class='pgbu-bluesky-icon pgbu-icon-signature'></i>",
					tooltip: U.translate(" E-Signature Status"),
					width: 37,
					headerAlign: 'center',
					dataDisplay: null,
					draggable: false,
					align: 'center',
					rendererFns: {
						getValueMarkup: function (options) {
							if (options.record['sign_status'] == 1)
								return "<span title='" + U.translate("In Progress") + "' class='pgbu-icon-yellow pgbu-bluesky-icon pgbu-icon-status-success'></span>";
							else if (options.record['sign_status'] == 2)
								return "<span title='" + U.translate("Completed") + "' class='pgbu-bluesky-icon pgbu-icon-status-success'></span>";
							else if (options.record['sign_status'] == 3)
								return "<span title='" + U.translate("Declined") + "' class='pgbu-bluesky-icon pgbu-icon-status-error'></span>";
							else if (options.record['sign_status'] == 4 && options.record['node_type_int'] != 1)
								return "<span title='" + U.translate("Recalled") + "' class='pgbu-icon-gray pgbu-bluesky-icon pgbu-icon-held'></span>";

						}
					}
				},
				{
					name: "commentsIcon",
					headerAlign: null,
					dataDisplay: null,
					width: 35,
					title: "<i class='pgbu-bluesky-icon pgbu-icon-comment'></i>",
					align: null,
					tooltip: U.translate("Comments"),
					rendererFns: {
						getValueMarkup: function (options) {
							if (options.record.file_id) {
								return $JustCheckedIcon.attr("id", "check5_" + options.record.id)[0].outerHTML;
							}
						}
					}
				},
				{
					name: "uuu_file_title",
					headerAlign: null,
					dataDisplay: null,
					width: 150,
					title: U.translate("Title"),
					align: null
				},
				{
					name: "revised",
					headerAlign: null,
					dataDisplay: null,
					width: 35,
					title: "<i class='pgbu-bluesky-icon pgbu-icon-check-in'></i>",
					align: 'center',
					tooltip: U.translate("Revised"),
					rendererFns: {
						getValueMarkup: function (options) {
							if (options.record.revised == 1) {
								return $JustCheckedIcon.attr("id", "check4_" + options.record.id)[0].outerHTML;
							}
						}
					}
				},
				{
					tooltip: U.translate("Name"),
					name: "node_name",
					title: U.translate("Name"),
					width: 180,
					sortable: true,
					hideable: false,
					menu: false,
					resizable: true,
					draggable: false,
					rendererFns: {
						getValueMarkup: function (options) {
							var markup = "";
							markup += "<span alt='File Icon' class='" + options.record['file_icon'] + "'></span>";

							markup += " " + options.formattedValue;
							return markup;
						}
					}
				},
				{
					name: "publication_no",
					headerAlign: null,
					dataDisplay: null,
					width: 75,
					title: U.translate("Pub. No."),
					numericSort: true,
					align: null
				},
				{
					name: "revision_no",
					headerAlign: null,
					dataDisplay: null,
					width: 75,
					title: U.translate("Rev. No."),
					align: null
				},
				{
					name: "uuu_file_issue_date",
					headerAlign: null,
					dataDisplay: null,
					width: 140,
					title: U.translate("Issue Date"),
					align: null,
					type: 'date'
				},
				{
					name: "uuu_file_size",
					headerAlign: null,
					dataDisplay: null,
					width: 100,
					title: U.translate("Size"),
					numericSort: true,
					align: null
				},
				{
					name: "node_path",
					headerAlign: null,
					dataDisplay: null,
					width: 180,
					title: U.translate("Location"),
					align: null,
					rendererFns: {
						getValueMarkup: function (options) {
							return "<span title='" + options.formattedValue + "'>" + options.formattedValue + "</span>";
						}
					}
				},
				{
					name: "publish_status",
					headerAlign: null,
					dataDisplay: null,
					width: 150,
					hideable: true,
					title: U.translate("Publish Status"),
					align: null,
					rendererFns: {
						getValueMarkup: function (options) {
							return U.translate(options.formattedValue);
						}
					}
				}
			]

			var actFnNamesReadOnly = [U.translate("Review"), U.translate("AutoVue Review"), U.translate("Download")];

			var actionsReadOnly = [{
					name: U.translate("Review"),
					action: function () {
						self.viewFile();
					}
				},
				{
					name: U.translate("AutoVue Review"),
					action: function () {
						self.viewInAutovue();
					}
				},
				{
					name: U.translate("Download"),
					action: function () {
						self.downloadFile();
					}
				}
			]

			var actFnNames = [U.translate("Review"), U.translate("AutoVue Review"), U.translate("Download"), U.translate("Revise"), "", U.translate("Remove")];

			var actions = [{
					name: U.translate("Review"),
					action: function () {
						self.viewFile();
					}
				},
				{
					name: U.translate("AutoVue Review"),
					action: function () {
						self.viewInAutovue();
					}
				},
				{
					name: U.translate("Download"),
					action: function () {
						self.downloadFile();
					}
				},
				{
					name: U.translate("Revise"),
					action: function () {
						self.reviseFile();
					}
				},
				{
					name: ""
				},
				{
					name: U.translate("Remove"),
					action: function () {
						self.removeFile();
					}
				},
				{
					name: U.translate("Send for E-Signature"),
					action: function () {
						self.sendForSign();
					}
				},
				{
					name: U.translate("Recall E-Sign Request"),
					action: function () {
						self.recallSignTask();
					}
				}
			]

			var actFnNamesForDocTypeLineItems = [U.translate("Review"), U.translate("AutoVue Review"), U.translate("Download"), U.translate("Revise"), U.translate("Send for E-Signature")];

			var actionsForDocTypeLineItems = [{
					name: U.translate("Review"),
					action: function () {
						self.viewFile();
					}
				},
				{
					name: U.translate("AutoVue Review"),
					action: function () {
						self.viewInAutovue();
					}
				},
				{
					name: U.translate("Download"),
					action: function () {
						self.downloadFile();
					}
				},
				{
					name: U.translate("Revise"),
					action: function () {
						self.reviseFile();
					}
				},
				{
					name: U.translate("Send for E-Signature"),
					action: function () {
						self.sendForSign();
					}
				},
				{
					name: U.translate("Recall E-Sign Request"),
					action: function () {
						self.recallSignTask();
					}
				}
			]

			var fmt = "yyyy/MM/dd HH:mm";

			var formatDate = function (value) {
				var dt = U.date.parse(value, fmt);
				if (dt !== 0) {
					return oj.IntlConverterUtils.dateToLocalIso(dt);
				} else {
					return "";
				}
			}

			var dblClicked = function (recordId, columnId) {
				_.each(self.attachmentGridData, function (value, key, list) {
					if (recordId == value.id)
						self.universalR([self.attachmentGridData[key]]);
				})
				self.viewFile();
			}

			self.attachMenuAction = function (event) {
				switch (event.target.value) {
					case "browse":
						self.browseClick();
						break;
					case "attdm":
						self.dmClick();
						break;
					case "custprint":
						self.attachCustomPrint();
						break;
				}
			}

			self.viewFile = function () {
				// if(contextTaskID != undefined)
				//     self.previewUrl = "/bp/rest/viewer/home/"+"BP/"+self.universalR()[0].id+"/"+self.universalR()[0].file_name+"/"+self.universalR()[0].file_ext+"/"+contextModel+"/"+contextRecID+"/"+contextTaskID+"/"+sessionBean+"/"+self.recordInfo.config.context.formid+"/"+self.recordInfo.config.context.no_workflow+"/"+self.isReadOnly()+"/"+contextModel+"/"+self.recordInfo.spec.studio.source;
				// else
				//     self.previewUrl = "/bp/rest/viewer/home/"+"BP/"+self.universalR()[0].id+"/"+self.universalR()[0].file_name+"/"+self.universalR()[0].file_ext+"/"+contextModel+"/"+contextRecID+"/"+self.recordInfo.config.context.task_id+"/"+sessionBean+"/"+self.recordInfo.config.context.formid+"/"+self.recordInfo.config.context.no_workflow+"/"+self.isReadOnly()+"/"+contextModel+"/"+self.recordInfo.spec.studio.source;

				self.previewUrl = "/bp/rest/viewer/viewer_home/";

				var cparam = {
					source_type: "BP",
					file_id: self.universalR()[0].id,
					file_name: self.universalR()[0].file_name,
					// fileExt: self.universalR()[0].file_ext,
					model: contextModel,
					recordId: contextRecID,
					sessionBean: sessionBean,
					form_id: self.recordInfo.config.context.formid,
					isNonWorkFlow: self.recordInfo.config.context.no_workflow,
					readOnly: self.isReadOnly(),
					studioSource: self.recordInfo.spec.studio.source
				}

				window.getFormSpec = function () {
					return self.recordInfo.spec.form;
				}

				if (contextTaskID != undefined)
					cparam.task_id = contextTaskID;
				else
					cparam.task_id = self.recordInfo.config.context.task_id;

				if (self.recordInfo.spec.studio.source == "document") {
					cparam.docTypeAddComments = false;
					if (self.recordInfo.spec.form.bp_tab["0"].params.add_comments == "1") {
						// if(self.recordInfo.spec.form.bp_tab["0"].editMode)
						// {
						//     if(!self.recordInfo.spec.form.bp_tab["0"].editMode.readOnly)
						//     {
						//         if(self.recordInfo.spec.form.bp_tab["0"].editMode.modifyOther)
						//         {
						cparam.docTypeAddComments = true;
						//         }
						//     }
						// }
					}

					if (self.recordInfo.spec.form.bp_tab["0"].params.add_final_comments == "1")
						cparam.docTypeAllowFinalComments = true;
					else
						cparam.docTypeAllowFinalComments = false;
				}
				//cparam.isProxy=self.isProxy();
				cparam.sign_agent = self.recordInfo.attachments.sign_agent;
				cparam.is_esign_enabled = self.recordInfo.attachments.is_esign_enabled;
				var reviewChild = U.open(U.urefSearch(self.previewUrl), {
					name: "uiViewer",
					w: 1900,
					h: 650
				}, cparam);
				//U.open(url,{name:'cancel_reserv',w:500,h:510,feature:"resizable=no"},cparam)
				var timer = setInterval(reviewCheckChild, 500);

				function reviewCheckChild() {
					if (reviewChild.closed) {
						self.refreshViewData();
						clearInterval(timer);
					}
				}
			}

			self.viewInAutovue = function () {
				// var item = self.universalR()[0];
				// var fileid = item['id'];
				// var filename = item['file_name'];
				// var projectid = contextPid;
				// var userid = item['create_by'];
				// var locale = U.locale;

				// var CL_PRTS = [5099, 2345, 7575, 8888, 9999];
				// var dmsUrl = self.getBaseUrl() + '/jvueDMS';
				// if(internalServerEnabled == "true") {
				//     dmsUrl = serverUrl+"/jvueDMS";
				// }
				// var jvueUrl = self.getBaseUrl()+'/VueServlet';
				// var JNLP_HOST = self.getBaseUrl()+'/VueJNLPServlet';
				// var CODEBASE_HOST = self.getBaseUrl()+'/jVue';
				// var INIT_PARAMS = {'DMS':dmsUrl,'JVUESERVER':jvueUrl,'VERBOSE':'debug','GUIFILE':'defaultview.gui', 'DMSARGS':'DMS_PRESERVE_COOKIES', 'LOCALE':locale};
				// var myAvApp = new AutoVue(JNLP_HOST, CODEBASE_HOST, CL_PRTS, INIT_PARAMS);
				// var jVueFileName="fileid="+fileid+"|filename="+filename+"|registryprefix="+registryprefix+"|markupids=0"+"|session=$session"+"|allmarkups=no|projectid="+projectid+"|userid="+userid+"|dateformat=MMM/dd/yyyy hh:mm a|access=true |allowdeletemarkup=no|showmarkupversions=no|allowimportmarkup=no|allowexportmarkup=no|showmarkuptypes=no|showmarkupreadonly=no";
				// myAvApp.setFile(jVueFileName);
				self.previewUrl = "/bp/rest/viewer/viewer_home/";

				var cparam = {
					source_type: "BP",
					file_id: self.universalR()[0].id,
					file_name: self.universalR()[0].file_name,
					model: contextModel,
					recordId: contextRecID,
					sessionBean: sessionBean,
					form_id: self.recordInfo.config.context.formid,
					isNonWorkFlow: self.recordInfo.config.context.no_workflow,
					readOnly: self.isReadOnly(),
					studioSource: self.recordInfo.spec.studio.source,
					sub_type: "AV",
					internalServerEnabled: internalServerEnabled,
					registryprefix: registryprefix,
					project_id: contextPid,
					user_id: self.recordInfo.config.context.curruserid
				}

				window.getFormSpec = function () {
					return self.recordInfo.spec.form;
				}

				if (contextTaskID != undefined)
					cparam.task_id = contextTaskID;
				else
					cparam.task_id = self.recordInfo.config.context.task_id;

				if (self.recordInfo.spec.studio.source == "document") {
					cparam.docTypeAddComments = false;
					if (self.recordInfo.spec.form.bp_tab["0"].params.add_comments == "1") {
						// if(self.recordInfo.spec.form.bp_tab["0"].editMode)
						// {
						//     if(!self.recordInfo.spec.form.bp_tab["0"].editMode.readOnly)
						//     {
						//         if(self.recordInfo.spec.form.bp_tab["0"].editMode.modifyOther)
						//         {
						cparam.docTypeAddComments = true;
						//         }
						//     }
						// }
					}

					if (self.recordInfo.spec.form.bp_tab["0"].params.add_final_comments == "1")
						cparam.docTypeAllowFinalComments = true;
					else
						cparam.docTypeAllowFinalComments = false;
				}
				//cparam.isProxy=self.isProxy();
				cparam.sign_agent = self.recordInfo.attachments.sign_agent;
				cparam.is_esign_enabled = self.recordInfo.attachments.is_esign_enabled;
				U.open(U.urefSearch(self.previewUrl), {
					name: "uiViewer",
					w: 1050,
					h: screen.height
				}, cparam);
			}

			self.getBaseUrl = function () {
				var murl = window.location;
				var mainurl = murl.toString();
				var ind = mainurl.indexOf("/", 10);

				if (ind <= 0)
					return mainurl;

				var substr = mainurl.substring(0, ind);
				return substr;
			}

			self.nativeView = function (file_id, fname) {
				var ind = fname.lastIndexOf(".");
				var extn = "";
				if (ind > -1)
					extn = fname.substring(ind + 1);
				var fromOjet = true;
				var url = "/bp/share/native_view?file_id=" + file_id + "&dummy=a." + extn + "&fromOjet=" + fromOjet;
				var viewfile = window.open(url, "view_file", "resizable=yes,status=no,menubars=no,addressbars=no,left=" + (screen.width - 750) / 2 + ",top=" + (screen.height - 600) / 2 + ",height=600,width=750");
				viewfile.focus();
				return;
			}

			self.downloadFile = function () {
				var attachmentform = $(element.getNodeBySubId({
					subId: "attachmentform"
				}));
				if (self.universalR().length == 1) {
					var item = self.universalR()[0];
					var fileid = item['id'];
					if (window.document.attachform != undefined) {
						window.document.attachform.action = "/bp/sys/dm/new/download?ids=" + fileid + "&from=attachment&fileids=" + fileid;
						//U.submitForm(window.document.attachform);
						U.downloadFile(window.document.attachform, fileid, 'attachment');
					} else {
						if (window.document.attachmentform.action != undefined) {
							window.document.attachmentform.action = "/bp/sys/dm/new/download?ids=" + fileid + "&from=attachment&fileids=" + fileid;
							//U.submitForm(window.document.attachmentform);
							U.downloadFile(window.document.attachmentform, fileid, 'attachment');
						} else {
							window.document.attachmentform[0].action = "/bp/sys/dm/new/download?ids=" + fileid + "&from=attachment&fileids=" + fileid;
							//U.submitForm(window.document.attachmentform[0]);
							U.downloadFile(window.document.attachmentform[0], fileid, 'attachment');
						}
					}
				} else if (self.universalR().length > 1) {
					var fileids;
					_.each(self.universalR(), function (value, key, list) {
						if (fileids == undefined)
							fileids = value.id;
						else
							fileids = fileids + ',' + value.id;
					});
					if (window.document.attachform != undefined) {
						window.document.attachform.action = "/bp/sys/dm/new/download?ids=" + fileids + "&from=attachment&fileids=" + fileids;
						//U.submitForm(window.document.attachform);
						U.downloadFile(window.document.attachform, fileids, 'attachment');
					} else {
						if (window.document.attachmentform.action != undefined) {
							window.document.attachmentform.action = "/bp/sys/dm/new/download?ids=" + fileids + "&from=attachment&fileids=" + fileids;
							//U.submitForm(window.document.attachmentform);
							U.downloadFile(window.document.attachmentform, fileids, 'attachment');
						} else {
							window.document.attachmentform[0].action = "/bp/sys/dm/new/download?ids=" + fileids + "&from=attachment&fileids=" + fileids;
							//U.submitForm(window.document.attachmentform[0]);
							U.downloadFile(window.document.attachmentform[0], fileids, 'attachment');
						}
					}
				}
			};

			self.reviseFile = function () {
				if (self.universalR()[0].sign_status == 1) {
					U.AlertByKey("dm_inprogress_found");
					return;
				}
				window.getSelectedRevisions = function () {
					var revisionItems = [];
					var reviseItem = [];
					reviseItem.parentRank = self.universalR()[0].parent_rank;
					reviseItem.parentID = self.universalR()[0].parent_id;
					reviseItem.fileName = self.universalR()[0].node_name;
					reviseItem.fileSize = self.universalR()[0].uuu_file_size;
					reviseItem.title = self.universalR()[0].title;
					reviseItem.revisionNum = self.universalR()[0].revision_no;
					reviseItem.issueDate = self.universalR()[0].issue_date;
					reviseItem.extension = self.universalR()[0].extn;
					reviseItem.pubNo = self.universalR()[0].publication_no;
					reviseItem.projectID = self.universalR()[0].project_id;
					reviseItem.model_type = contextModel;
					reviseItem.parenttype = self.universalR()[0].parent_type;
					reviseItem.bp_type = self.recordInfo.spec.studio.source;
					if (contextRecID > 0)
						reviseItem.contextRecID = contextRecID;
					else
						reviseItem.contextRecID = contextTaskID;
					reviseItem.user_id = self.universalR()[0].create_by;
					reviseItem.isOjet = true;
					revisionItems.push(reviseItem);
					return revisionItems;
				}
				window.getAllFileNames = function () {
					var fileNames = new Map();
					var items = self.attachmentGridData;

					for (var i = 0; i < items.length; i++) {
						var item = items[i];
						var parentRank = item["parent_rank"];
						var fileName = item["file_name"];

						fileNames.set(fileName.toLowerCase(), parentRank);
					}
					return fileNames;
				}
				var params = "?parent_ranks=" + parent_rank;
				var url = "/bp/studio/share/FileBpRevise.vm" + params;
				var child = U.open(url, {
					name: "reviseAttachments",
					w: 950,
					h: 550,
					feature: "resizable,scrollbars"
				});

				var timer = setInterval(checkChild, 500);

				function checkChild() {
					if (child.closed) {
						self.refreshViewData();
						clearInterval(timer);
						if (self.recordInfo.spec.studio.source == "document") {
							parent.refresh_lineitem_log();
							self.detailInfo.editMode = null; //set detailInfo.editMode to null to trigger openLineitem in lineitemModel.js
						}
					}
				}
			}

			self.sendForSign = function () {
				U.getDeferModule("esign-dialog-defer", "EsignatureDialog").then(function (ids) {
					//var ids = ko.dataFor(document.getElementById("EsignatureDialog"));
					var ids = ko.dataFor(document.getElementById("EsignatureDialog"));
					ids.setCalledFrom('bp');
					var bpLabel = self.recordInfo.spec.upper.label;
					ids.setRecordId(contextRecID);
					ids.setBPModel(contextModel);
					ids.setBPLabel(bpLabel);
					ids.setTaskId(contextTaskID);
					var fileids = [];
					var flag = 1
					_.each(self.universalR(), function (item) {
						if (item.sign_status == 1) {
							U.AlertByKey("esign_inprogress_doc_send");
							flag = 0
						}
						fileids.push(item.id);
					});
					if (flag == 1) {
						ids.setFileids(fileids);
						var k;
						ids.open();
					}
				});
			}

			self.recallSignTask = function () {
				U.ShowWaiting();
				var fileids = [];
				_.each(self.universalR(), function (item) {
					if (item.sign_status == 1) {
						fileids.push(item.id);
					}
				});
				var reason = "Recalled by the user";
				var url = "/bp/mod/dm/doc/get/recallesign";
				var postData = {
					fileids: fileids,
					reason: reason
				};
				U.call(url, postData, function (result) {
					if (result.status == "Success")
						U.Notification(U.translateMessage("esign_recall_success"));
					else if (result.status == "Failure")
						U.AlertByKey(result.Message);
					else
						U.AlertByKey("esign_recall_failed");
					self.refreshViewData();
					U.CloseShowWaiting();
				});
			}

			self.renderPreviewTab = function () {
				var nodeId = element.getNodeBySubId({
					subId: "previewBox"
				});
				var tabId = $(nodeId).ojTabs("option", "selected");
				var item = self.universalR();
				self.checkEsignTab();
				if (tabId == 1 && item.length > 0) {
					var event = {
						file_id: item[0].id,
						envelope_id: item[0].envid,
						tab: 'dmSignStatus',
						calledFrom: 'BP'
					};
					U.Event.publish('change_current_node', event);
				} else if (tabId == 0 && item.length > 0) {
					U.Event.publish('filePrevVals', self.universalR()[0].id + "~" + self.universalR()[0].file_name + "~" + self.universalR()[0].file_ext + "~" + self.universalR()[0].signature);
				}
			}

			self.attachCustomPrint = function () {
				var eventdata = {};
				eventdata.recordId = self.recordInfo.config.context.rec_id;
				if (eventdata.recordId == 0) {
					return;
				}
				eventdata.projectId = contextPid;
				eventdata.userId = self.recordInfo.config.context.curruserid;
				eventdata.model = self.recordInfo.config.context.prefix;

				var printResult = null;
				U.call("/bp/studio/workflow/params_for_Bp_log_print", {
					isBpLog: "yes",
					projectId: eventdata.projectId,
					userId: eventdata.userId,
					source_id: eventdata.recordId,
					model: eventdata.model
				}, function (result) {
					if (result === "") {
						return;
					}
					printResult = result;
				}, true);

				eventdata.recordNo = self.recordInfo.attachments.record_no;
				eventdata.source = self.recordInfo.spec.studio.source;
				eventdata.subType = self.recordInfo.config.context.lineSubType;
				eventdata.taskId = printResult.print_task_id;
				eventdata.processId = printResult.process_id;
				eventdata.formId = printResult.currentFormId;
				eventdata.isWorkflow = !self.recordInfo.spec.studio.no_workflow;
				eventdata.taskNodeid = self.recordInfo.config.context.task_node_id;
				//self.customPrintView.doCustomPrintAttach(projectId, source, subType, model, recordNo, recordId, taskId, processId,taskNodeid, formId, isWorkflow, false, true);
				U.Event.publish('attach_custom_print', eventdata);
			};

			self.removeFile = function () {
				if (self.universalR().length == 1)
					self.deleteFile();
				else if (self.universalR().length > 1) {
					self.universalT(self.universalR());
					_.each(self.universalT(), function (value, key, list) {
						self.universalS(value);
						self.deleteFileMultiple();
					});
				}
			}

			self.deleteFile = function () {
				var removeApproved;
				var recordOwner = false;
				var attachmentCreator = false;
				var OwnerOrCreator;
				if (self.recordInfo.attachments.k__creator_id == self.recordInfo.config.context.curruserid) {
					recordOwner = true;
				}
				if (self.universalR()[0].create_by == self.recordInfo.config.context.curruserid) {
					attachmentCreator = true;
				}

				OwnerOrCreator = recordOwner || attachmentCreator;

				if (OwnerOrCreator && self.canRemove() == true)
					removeApproved = true;
				else if (OwnerOrCreator && self.universalR()[0].parent_type == "task")
					removeApproved = true;
				else if (OwnerOrCreator && self.isLineItem() == true && self.detailInfo.params.delattach == "1")
					removeApproved = true;
				else if (OwnerOrCreator && self.isLineItem() == true && self.detailInfo.params.removeitem == "1")
					removeApproved = true;
				else if (OwnerOrCreator && self.isLineItem() == true && self.detailInfo.params.remove_item == "1")
					removeApproved = true;
				else if(OwnerOrCreator && self.isLineItem() == true && self.detailInfo.source == "rfb")
					removeApproved = true;
				else if(OwnerOrCreator && self.recordInfo.config.context.no_workflow == true)
					removeApproved = true;
				else if (self.universalR()[0].parent_type != "task") {
					if (self.canRemove() == true)
						removeApproved = true;
					else
						removeApproved = false;
				}

				if (self.universalR()[0].sign_status == 1) {
					U.AlertByKey("dm_inprogress_found");
					return;
				}

				// if(removeFlag == false) {
				//     U.AlertByKey("cannot_delete_others_attachments");
				//     return;
				// }

				// if(removeFlag == true) {
				//     if(self.universalR()[0].parent_type != "task") {
				//         if(self.universalR()[0].parent_type.indexOf('_lineitem') > 0)
				//             removeApproved = true;
				//         else {
				//             if(self.canRemove() == true)
				//                 removeApproved = true;
				//             else
				//                 removeApproved = false;
				//         }
				//     }
				//     else
				//         removeApproved = true;
				// }

				// if(no_task !=1 && self.universalR()[0].parent_type != "task" && self.universalR()[0].parent_type != "login_session" && self.canRemove() == false)
				// {
				//     U.AlertByKey("cannot_delete_others_attachments");
				//     return;
				// }

				if (removeApproved == false) {
					U.AlertByKey("cannot_delete_others_attachments");
					return;
				}

				var apiURL = "/bp/studio/share/delete_files";

				if (contextTaskID == undefined)
					contextTaskID = self.recordInfo.config.context.task_id;

				if (contextTaskID > 0 && contextRecID == 0) {
					model_type = 'task';
					model_id_1 = contextTaskID;
				} else {
					model_type = contextModel;
					model_id_1 = contextRecID;
				}

				var postData = {
					deletelinkandauditlineitem: 1,
					delete_files_ids: self.universalR()[0].id,
					parent_rank1: self.universalR()[0].parent_rank,
					linetype: "",
					sourcetype: model_type,
					sourceid: model_id_1,
					draftcomment: "",
					isDocReview: true,
					id_1: model_id_1,
					type_1: model_type,
					projectId: contextPid
				};

				if (self.recordInfo.spec.studio.source == "rfb" && self.recordInfo.config.context.formid == "form.bid.0")
					postData.sourcetype = model_type + "_bid";

				U.call(apiURL, postData, function (data) {
					if (self.recordInfo.spec.studio.source == "document" && self.detailInfo.tab_id == 0) {
						// Doc type bp Delete
						self.resetFileIdPostAttachmentRemove();

					} else {
						self.refreshViewData();
					}
				});
			}

			self.deleteFileMultiple = function () {

				var removeApproved;
				var recordOwner = false;
				var attachmentCreator = false;
				var OwnerOrCreator;
				if (self.recordInfo.attachments.k__creator_id == self.recordInfo.config.context.curruserid) {
					recordOwner = true;
				}
				if (self.universalS().create_by == self.recordInfo.config.context.curruserid) {
					attachmentCreator = true;
				}

				OwnerOrCreator = recordOwner || attachmentCreator;

				if (OwnerOrCreator && self.canRemove() == true)
					removeApproved = true;
				else if (OwnerOrCreator && self.universalS().parent_type == "task")
					removeApproved = true;
				else if (OwnerOrCreator && self.isLineItem() == true && self.detailInfo.params.delattach == "1")
					removeApproved = true;
				else if (OwnerOrCreator && self.isLineItem() == true && self.detailInfo.params.removeitem == "1")
					removeApproved = true;
				else if (OwnerOrCreator && self.isLineItem() == true && self.detailInfo.params.remove_item == "1")
					removeApproved = true;
				else if (self.universalS().parent_type != "task") {
					if (self.canRemove() == true)
						removeApproved = true;
					else
						removeApproved = false;
				}

				if (self.universalS().sign_status == 1) {
					U.AlertByKey("dm_inprogress_found");
					return;
				}

				if (removeApproved == false) {
					U.AlertByKey("cannot_delete_others_attachments");
					return;
				}

				var apiURL = "/bp/studio/share/delete_files";

				if (contextTaskID == undefined)
					contextTaskID = self.recordInfo.config.context.task_id;

				if (contextTaskID > 0 && contextRecID == 0) {
					model_type = 'task';
					model_id_1 = contextTaskID;
				} else {
					model_type = contextModel;
					model_id_1 = contextRecID;
				}

				var postData = {
					deletelinkandauditlineitem: 1,
					delete_files_ids: self.universalS().id,
					parent_rank1: self.universalS().parent_rank,
					linetype: "",
					sourcetype: model_type,
					sourceid: model_id_1,
					draftcomment: "",
					isDocReview: true,
					id_1: model_id_1,
					type_1: model_type,
					projectId: contextPid
				};

				if (self.recordInfo.spec.studio.source == "rfb" && self.recordInfo.config.context.formid == "form.bid.0")
					postData.sourcetype = model_type + "_bid";

				U.call(apiURL, postData, function (data) {
					if (self.recordInfo.spec.studio.source == "document" && self.detailInfo.tab_id == 0) {
						// Doc type bp Delete
						self.resetFileIdPostAttachmentRemove();

					} else {
						self.refreshViewData();
					}
				});
			}

			self.resetFileIdPostAttachmentRemove = function () {
				var detail = self.detailInfo;

				if (detail && detail.selected) {
					var payload = {};
					payload.context = _.pick(self.recordInfo.config.context, "prefix", "rec_id", "pid", "task_id");
					payload.context.lineitemid = detail.selected.id + "";

					U.rest('POST', '/bp/mod/bp/record/resetFileId', payload, function (response) {
						U.CloseShowWaiting();

						if (response.error && response.error.length > 0) {
							U.Alert(response.error[0]);
						} else {
							console.log("Attachment reset successfully");
							console.log(response.data);
							parent.refresh_lineitem_log();
							self.refreshViewData();
							detail.removeFromAttachmentTab = true;
						}
					});
				}
			};

			var $UncheckedIcon = $("<i title='" + U.translate("Publish to Document Manager") + "' style='background-color:#ffffff' data-trigger='check-clicked' class='pgbu-icon icon-accepted-default icon-checkbox_unselected'></i>");
			var $CheckedIcon = $("<i title='" + U.translate("Publish to Document Manager") + "' style='background-color:#ffffff' data-trigger='check-clicked' class='pgbu-icon icon-accepted-default icon-checkbox_selected'></i>");
			var $JustCheckedIcon = $("<i style='background-color:#ffffff' class='pgbu-bluesky-icon pgbu-icon-checkmark-checked'></i>");
			var $UncheckedIconNoTrigger = $("<i style='background-color:#ffffff' class='pgbu-icon icon-accepted-default icon-checkbox_unselected'></i>");
			var $CheckedIconNoTrigger = $("<i title='" + U.translate("Published in Document Manager") + "' style='background-color:#ffffff' class='pgbu-icon icon-accepted-default icon-checkbox_selected'></i>");
			var $UncheckedIconRepublish = $("<i title='" + U.translate("Republish to Document Manager") + "' style='background-color:#ffffff' data-trigger='republish-clicked' class='pgbu-icon icon-accepted-default icon-checkbox_unselected'></i>");
			var $CheckedIconRepublish = $("<i title='" + U.translate("Republish to Document Manager") + "' style='background-color:#ffffff' data-trigger='republish-clicked' class='pgbu-icon icon-accepted-default icon-checkbox_selected'></i>");

			self.loadData = function () {
				if (self.attachmentGrid != undefined)
					self.attachmentGrid.loadData([]);
				if (self.revRefGrid != undefined)
					self.revRefGrid.loadData([]);
				if (contextRecID > 0 || contextTaskID > 0) {
					self.refreshViewData();
					$(element.getNodeBySubId({
						subId: "attachment-container"
					})).show();
					$(element.getNodeBySubId({
						subId: "attachment-total"
					})).show();
					$(element.getNodeBySubId({
						subId: "attachmentpicker-info-container"
					})).hide();
					$(element.getNodeBySubId({
						subId: "previewBox"
					})).hide();
				} else {
					$(element.getNodeBySubId({
						subId: "attachment-container"
					})).hide();
					$(element.getNodeBySubId({
						subId: "attachment-total"
					})).hide();
					$(element.getNodeBySubId({
						subId: "attachmentpicker-info-container"
					})).show();
					$(element.getNodeBySubId({
						subId: "previewBox"
					})).hide();
				}
				if (self.detailInfo != undefined) {
					self.refreshViewData();
				}

			}

			self.refreshIcon = function (count) {
				if (self.recordInfo.spec.studio.source == "document" && self.detailInfo.tab_id == 0)
					return;

				if (self.detailInfo && self.detailInfo.selected) { // refresh lineitem grid icon
					if (count > 0 && self.detailInfo.selected.i__attach > 0)
						return;
					if (count == 0 && self.detailInfo.selected.i__attach == 0)
						return;
					var ugrid = self.detailInfo.currentGrid ? self.detailInfo.currentGrid : self.detailInfo.ulog.getGrid();
					ugrid.updateData(self.detailInfo.selected.id, {
						i__attach: count
					});
				}

			}
	
	self.addComment = function(postData){
		var apiURL = "/bp/rest/viewer/addComment";
		//var data = window.opener.getFileData();
		
		//alert(data);
		U.call(apiURL, postData, function(data) {
			console.log(data);
        });
	};
	
	var flag = true;
			self.refreshViewData = function (isRefreshView) {
				if (attachmentURL == undefined)
					self.URLGenerator();
				if (attachmentURL != undefined) {
					var apiURL = "/bp" + attachmentURL;

					var postData = {
						fromOjet: true
					};

					U.call(apiURL, postData, function (data) {
						if (data != undefined && data.length > 0) {
							$(element.getNodeBySubId({
								subId: "attachmentpicker-info-container"
							})).hide();
							$(element.getNodeBySubId({
								subId: "attachment-container"
							})).show();
							$(element.getNodeBySubId({
								subId: "attachment-total"
							})).show();
							// self.listOfFileIds(' ');
							_.each(data, function (value, key, list) {
								value.checked = true;
								value.node_name = value.file_name;
								var x = Math.ceil(value.file_size / 1024);
								value.uuu_file_size = U.translate("{0} KB", x);
								value.uuu_file_title = value.title;
								value.uuu_file_revision_no = value.revision_no;
								value.uuu_file_issue_date = formatDate(value.issue_date);
								if (value.publication_no == 0)
									value.publication_no = "";
								if (value.id != value.parent_rank)
									value.revised = 1;
								/*if(self.listOfFileIds() != " ")
								    self.listOfFileIds(self.listOfFileIds()+"|"+value.id+"~"+value.file_name);
								else
								    self.listOfFileIds(value.id+"~"+value.file_name);*/
								if(flag){
									var postData = self.recordInfo.postData;
									postData.file_id = value.id;
									var jsonAnnotation = {
										"type":"rectangle",
										"color":"red",
										"x":5.757636655948553,
										"y":9.767045454545455,
										"width":35.58413719185423,
										"height":83.63636363636364,
										"file_id": value.id,
										"scaled":1,
										"page_num":1
									};
									
								//	var annotation = "[" + JSON.stringify(jsonAnnotation) + "]";
								//	postData.annotations = postData.annotations;
								console.log('Attachment -- :'+JSON.stringify(postData));
									self.addComment(postData);
									flag = false;
								}
							});
							self.attachmentGridData = data;
							if (self.attachmentGrid != undefined) {
								self.attachmentGrid.loadData(data);
								self.attachmentGrid.gridSelectCell(data[0].id, 0, 0);
							}
							_.each(data, function (value, key, list) {
								if (self.isReadOnly() == true || !self.canRepublish()) {
									if (value.publish == 1)
										$("#check_" + value.id).removeClass("icon-checkbox_selected icon-accepted-default").addClass("icon-accepted-default icon-checkbox_unselected");
									else if (value.publish == 0 || value.publish == 2)
										$("#check_" + value.id).removeClass("icon-accepted-default icon-checkbox_unselected").addClass("icon-checkbox_selected icon-accepted-default");
								} else {
									if ((value.publish == 1 && value.publication_no == "") || (value.publish == 0 && value.publication_no != ""))
										$("#check_" + value.id).removeClass("icon-checkbox_selected icon-accepted-default").addClass("icon-accepted-default icon-checkbox_unselected");
									else
										$("#check_" + value.id).removeClass("icon-accepted-default icon-checkbox_unselected").addClass("icon-checkbox_selected icon-accepted-default");

								}
							});
							self.attachCount(data.length);
							self.refreshIcon(data.length);
							self.attGridInitSize();
						} else {
							self.attachmentGridData = [];
							$(element.getNodeBySubId({
								subId: "attachment-container"
							})).hide();
							$(element.getNodeBySubId({
								subId: "attachment-total"
							})).hide();
							$(element.getNodeBySubId({
								subId: "attachmentpicker-info-container"
							})).show();
							$(element.getNodeBySubId({
								subId: "previewBox"
							})).hide();
							self.refreshIcon(0);
						}
					});
				}
			}

			var dataFieldsRev = [{
					tooltip: U.translate("Publish"),
					name: "check_icon2",
					title: U.translate("Publish"),
					width: 65,
					sortable: false,
					hideable: false,
					menu: false,
					resizable: true,
					draggable: false,
					align: 'center',
					displayType: 'check',
					rendererFns: {
						getValueMarkup: function (options) {
							if (self.isReadOnly() == true) {
								if (options.record.publish == 0) {
									return $CheckedIconNoTrigger.attr("id", "check2_" + options.record.id)[0].outerHTML;
								} else {
									return $UncheckedIconNoTrigger.attr("id", "check2_" + options.record.id)[0].outerHTML;
								}
							} else if (self.isReadOnly() == false) {
								if (options.record.publish == 0) {
									if (options.record.publication_no > 0)
										return $UncheckedIconRepublish.attr("id", "check2_" + options.record.id)[0].outerHTML;
									//return $CheckedIconRepublish.attr("id", "check2_" +  options.record.id)[0].outerHTML;
									else
										return $CheckedIcon.attr("id", "check2_" + options.record.id)[0].outerHTML;
								} else {
									if (options.record.publication_no > 0)
										return $CheckedIconRepublish.attr("id", "check2_" + options.record.id)[0].outerHTML;
									//return $UncheckedIconRepublish.attr("id", "check2_" +  options.record.id)[0].outerHTML;
									else
										return $UncheckedIcon.attr("id", "check2_" + options.record.id)[0].outerHTML;
								}
							}
						}
					}
				},
				{
					name: "uuu_comment_type",
					headerAlign: null,
					dataDisplay: null,
					width: 35,
					title: "<i class='pgbu-bluesky-icon pgbu-icon-comment'></i>",
					tooltip: U.translate("Comments"),
					align: null,
					rendererFns: {
						getValueMarkup: function (options) {
							if (options.record.uuu_comment_type > 0) {
								return $JustCheckedIcon.attr("id", "check3_" + options.record.id)[0].outerHTML;
							}
						}
					}
				},
				{
					name: "node_name",
					headerAlign: null,
					dataDisplay: null,
					width: 180,
					title: U.translate("Name"),
					align: null,
					rendererFns: {
						getValueMarkup: function (options) {
							var markup = "";
							markup += "<span alt='File Icon' class='" + options.record['file_icon'] + "'></span>";

							markup += " " + options.formattedValue;
							return markup;
						}
					}
				},
				{
					name: "xref_status",
					headerAlign: null,
					dataDisplay: null,
					width: 50,
					title: U.translate("Ref."),
					align: 'center',
					rendererFns: {
						getValueMarkup: function (options) {
							if (options.record.xref_status > 0) {
								return $JustCheckedIcon.attr("id", "check3_" + options.record.id)[0].outerHTML;
							}
						}
					}
				},
				{
					name: "version",
					headerAlign: null,
					dataDisplay: null,
					width: 75,
					title: U.translate("Pub. No."),
					numericSort: true,
					align: null
				},
				{
					name: "upload_date",
					headerAlign: null,
					dataDisplay: null,
					width: 140,
					title: U.translate("Upload Date"),
					align: null,
					type: 'datetime'
				},
				{
					name: "file_size",
					headerAlign: null,
					dataDisplay: null,
					width: 75,
					title: U.translate("Size"),
					numericSort: true,
					align: null
				},
				{
					name: "uuu_create_by",
					headerAlign: null,
					dataDisplay: null,
					width: 150,
					title: U.translate("Upload By"),
					align: null
				},
				{
					name: "revision_no",
					headerAlign: null,
					dataDisplay: null,
					width: 75,
					title: U.translate("Rev. No."),
					align: null
				},
				{
					name: "uuu_file_issue_date",
					headerAlign: null,
					dataDisplay: null,
					width: 140,
					title: U.translate("Issue Date"),
					align: null,
					type: 'date'
				}
			]

			var dataFieldsRef = [{
					name: "display_filename",
					headerAlign: null,
					dataDisplay: null,
					width: 180,
					title: U.translate("File Name"),
					align: null
				},
				{
					name: "status",
					headerAlign: null,
					dataDisplay: null,
					width: 75,
					title: U.translate("Status"),
					align: null
				},
				{
					name: "node_path",
					headerAlign: null,
					dataDisplay: null,
					width: 180,
					title: U.translate("Location"),
					align: null
				},
				{
					name: "file_size",
					headerAlign: null,
					dataDisplay: null,
					width: 75,
					title: U.translate("Size"),
					numericSort: true,
					align: null
				},
				{
					name: "publication_no",
					headerAlign: null,
					dataDisplay: null,
					width: 75,
					title: U.translate("Pub. No."),
					numericSort: true,
					align: null
				},
				{
					name: "pub_date",
					headerAlign: null,
					dataDisplay: null,
					width: 100,
					title: U.translate("Pub. Date"),
					align: null,
					type: 'datetime'
				}
			]


			self.tabChangeHandler = function () {
				var nodeId = element.getNodeBySubId({
					subId: "revRefTab"
				});
				var tabId = $(nodeId).ojTabs("option", "selected");
				//   $('#tab-id').children().removeClass("oj-selected");
				self.checkReferencesTab();
				if (self.universalR().length != 0) {
					selectedFileName = self.universalR()[0].node_name;
					selectedFileID = self.universalR()[0].id;
					parent_rank = self.universalR()[0].parent_rank;
				}

				if (tabId == 0) {
					self.revRefGrid.defineColumns(dataFieldsRev);
					self.revRefGrid.defineRecordKeys({
						numericalId: true
					});
					self.revRefGrid.renderGrid(["check_icon2", "node_name", "uuu_comment_type", "xref_status", "version", "upload_date", "file_size", "uuu_create_by", "revision_no", "uuu_file_issue_date"]);
					// self.revRefGrid.setSortBy("node_name");
					self.revRefGrid.loadData([]);

					if (self.universalR().length != 0) {
						var apiURL = "/bp/attachment/revision_log/search_ojet";
						var postData = {
							source_id: parent_rank,
							name: selectedFileName,
							projectId: contextPid,
							view_only: "",
							bpattach: 1,
							fromOjet: true
						};

						U.call(apiURL, postData, function (data) {
							var modifiedData = [];
							_.each(data, function (value, key, list) {
								if (value.linknodeid != self.universalR()[0].linknodeid)
									modifiedData.push(value);
							});
							_.each(modifiedData, function (value, key, list) {
								value.node_name = value.file_name;
								var x = Math.ceil(value.file_size / 1024);
								value.file_size = U.translate("{0} KB", x);
								value.uuu_file_issue_date = formatDate(value.issue_date);
								value.upload_date = formatDate(value.upload_date);
							});
							if (modifiedData != undefined && modifiedData.length > 0) {
								self.revRefGrid.loadData(modifiedData);
								self.datalengthRevRef(modifiedData.length);
							} else {
								self.revRefGrid.loadData([]);
								self.datalengthRevRef(0);
							}
						});
					}
				} else if (tabId == 1 && self.hasReferences() == true) {
					self.revRefGrid.defineColumns(dataFieldsRef);
					self.revRefGrid.defineRecordKeys({
						numericalId: true
					});
					self.revRefGrid.renderGrid(["display_filename", "status", "node_path", "file_size", "publication_no", "pub_date"]);
					// self.revRefGrid.setSortBy("display_filename");
					self.revRefGrid.loadData([]);

					var item = self.universalR()[0];
					if (item) {
						var canAddFile = "true";
						if (self.hasMC() == false && self.hasUF() == false)
							canAddFile = "false";
						else {
							if (item.parent_type != "task" && item.parent_type != "login_session" /*&& delattach == "false"*/ )
								canAddFile = "false";
						}

						var apiURL = "/bp/dm/form/view/references_Ojet";
						var postData = {
							parent_file_id: item.id,
							calledFrom: "BP",
							canAddFile: canAddFile,
							view_only: "",
							fromOjet: true
						};

						U.call(apiURL, postData, function (data) {
							if (data != undefined && data.length > 0) {
								_.each(data, function (value, key, list) {
									var x = Math.ceil(value.file_size / 1024);
									value.file_size = U.translate("{0} KB", x);
									value.pub_date = formatDate(value.pub_date);
									switch (value.xref_type) {
										case 0:
											value.status = U.translate("Missing");
											break;
										case 1:
											value.status = U.translate("Private");
											break;
										case 2:
											value.status = U.translate("Static");
											break;
										case 3:
											value.status = U.translate("Dynamic");
											break;
										default:
											break;
									}
								});
								self.revRefGrid.loadData(data);
								self.datalengthRevRef(data.length);
							} else {
								self.revRefGrid.loadData([]);
								self.datalengthRevRef(0);
								$(nodeId).ojTabs("refresh");
							}
						});
					} else {
						// U.AlertByKey("not_a_reference_file");
						self.revRefGrid.loadData([]);
						self.datalengthRevRef(0);
					}
				}
			}

			self.checkReferencesTab = function () {
				var canAddFile = "true";
				if (self.hasMC() == false && self.hasUF() == false)
					canAddFile = "false";
				else {
					if (self.universalR()[0].parent_type != "task" && self.universalR()[0].parent_type != "login_session" /*&& delattach == "false"*/ )
						canAddFile = "false";
				}

				var apiURL = "/bp/dm/form/view/references_Ojet";
				var postData = {
					parent_file_id: self.universalR()[0].id,
					calledFrom: "BP",
					canAddFile: canAddFile,
					view_only: "",
					fromOjet: true
				};

				U.call(apiURL, postData, function (data) {
					if (data != undefined && data.length > 0) {
						self.hasReferences(true);
					} else {
						self.hasReferences(false);
					}
				});
			}

			self.checkEsignTab = function () {
				var item = self.universalR()[0];
				if (item.sign_status == 0) {
					self.hasEsignDocs(false);
				} else {
					self.hasEsignDocs(true);
				}
			}

			self.browseClick = function () {
				self.recordInfo.requireSilentSave().then(function (response) {
					//BUG 28991179
					if (postCompleteURL == undefined || contextTaskID != self.recordInfo.config.context.task_id) {
						contextTaskID = self.recordInfo.config.context.task_id;
						self.URLGenerator();
					}
					var apiURL = "/bp/mod/dm/doc/get/createFeatures";
					var postData = {
						permCondition: 'p_create'
					};
					U.call(apiURL, postData, function (data) {
						if (data.errorMsg != null) {
							U.AlertByKey(data.errorMsg);
							return;
						} else {
							var filePickerObj = new FilePickerControl("filePickerObj", top);
							filePickerObj.setUpload_type("attachments");
							filePickerObj.setContentSource("3");
							filePickerObj.setSingle("no");
							filePickerObj.setFile_type("bp");
							filePickerObj.setProject_id(contextPid);
							filePickerObj.setDuplicatecheck(dupCheckURL);
							filePickerObj.setPostcomplete(postCompleteURL);
							filePickerObj.setOjetHomePageObject(self);
							filePickerObj.openLocal();
						}
					});
				});


				// if(self.callSilentSave() == 1) {
				//     self.recordInfo.silentSave().then(function(response){
				//         if(response.errors.length > 0) {

				//         }
				//         else {
				//             self.callSilentSave(0);
				//             var apiURL = "/bp/mod/dm/doc/get/createFeatures";
				//             var postData = { permCondition:'p_create'};
				//             U.call(apiURL, postData, function(data) {
				//                 if(data.errorMsg != null){
				//                     U.AlertByKey(data.errorMsg);
				//                     return;
				//                 }else{
				//                     var filePickerObj = new FilePickerControl( "filePickerObj", top);
				//                     filePickerObj.setUpload_type("attachments");
				//                     filePickerObj.setContentSource("3");
				//                     filePickerObj.setSingle("no");
				//                     filePickerObj.setFile_type("bp");
				//                     filePickerObj.setProject_id(contextPid);
				//                     filePickerObj.setDuplicatecheck(dupCheckURL);
				//                     filePickerObj.setPostcomplete(postCompleteURL);
				//                     filePickerObj.setOjetHomePageObject(self);
				//                     filePickerObj.openLocal();
				//                 }
				//             });
				//         }
				//     });
				// }
				// else {
				//     var apiURL = "/bp/mod/dm/doc/get/createFeatures";
				//     var postData = { permCondition:'p_create'};
				//     U.call(apiURL, postData, function(data) {
				//         if(data.errorMsg != null){
				//             U.AlertByKey(data.errorMsg);
				//             return;
				//         }else{
				//             var filePickerObj = new FilePickerControl( "filePickerObj", top);
				//             filePickerObj.setUpload_type("attachments");
				//             filePickerObj.setContentSource("3");
				//             filePickerObj.setSingle("no");
				//             filePickerObj.setFile_type("bp");
				//             filePickerObj.setProject_id(contextPid);
				//             filePickerObj.setDuplicatecheck(dupCheckURL);
				//             filePickerObj.setPostcomplete(postCompleteURL);
				//             filePickerObj.setOjetHomePageObject(self);
				//             filePickerObj.openLocal();
				//         }
				//     });
				// }
			};

			self.onDmSelect = function (event, data) {
				if (event.detail.refresh == true && event.detail.calledfrom == "AttPicker")
					self.refreshViewData();
			}

			self.setSourceIdnType = function () {
				if (self.detailInfo != undefined) {
					sourceId = self.detailInfo.selected.id;
					if (self.recordInfo.config.context.formid != undefined && self.recordInfo.config.context.formid != "form.bid.0")
						sourceType = self.detailInfo.formSpec.prefix + "_lineitem";
					else if (self.recordInfo.config.context.formid != undefined && self.recordInfo.config.context.formid == "form.bid.0")
						sourceType = self.detailInfo.formSpec.prefix + "_bid_lineitem";
				} else if (self.recordInfo != undefined) {
					var taskId = self.recordInfo.config.context.task_id;
					if (taskId > 0) {
						sourceId = taskId;
						sourceType = 'task';
					} else {
						sourceId = self.recordInfo.config.context.rec_id;
						sourceType = self.recordInfo.config.context.prefix;
					}
				}
			}

			self.dmClick = function () {
				U.getDeferModule("dmpicker", "DMLogDialog").then(function (ids) {
					var calledFrom = 'AttPicker';
					self.recordInfo.requireSilentSave().then(function (response) {
						//BUG 28991179
						if (postCompleteURL == undefined || contextTaskID != self.recordInfo.config.context.task_id) {
							contextTaskID = self.recordInfo.config.context.task_id;
							self.URLGenerator();
						}
						ids.setPID(contextPid);
						self.setSourceIdnType();
						ids.setSourceType(sourceId, sourceType);
						if (postCompleteURL != undefined)
							ids.open(calledFrom, postCompleteURL, contextTaskID, true, self.attachmentGridData);
					});

					// if(self.callSilentSave() == 1) {
					//     self.recordInfo.silentSave().then(function(response){
					//         if(response.errors.length > 0) {
					//             // console.log(JSON.stringify(response.errors));
					//         }
					//         else {
					//             self.callSilentSave(0);
					//             ids.setPID(contextPid);
					//             self.setSourceIdnType();
					//         	ids.setSourceType(sourceId, sourceType);
					//             if(postCompleteURL != undefined)
					//                 ids.open(calledFrom,postCompleteURL,contextTaskID, true, self.attachmentGridData);
					//         }
					//     });
					// }
					// else {
					//     if(postCompleteURL == undefined)
					//         self.URLGenerator();
					//     ids.setPID(contextPid);
					//     self.setSourceIdnType();
					//     ids.setSourceType(sourceId, sourceType);
					//     if(postCompleteURL != undefined)
					//         ids.open(calledFrom,postCompleteURL,contextTaskID, true, self.attachmentGridData);
					// }
				});
			}

			// inherit from formField
			base.call(self, context);

			var initGridPromise;

			self.initialize = function () {
				gridContainer = element.getNodeBySubId({
					subId: "attachment-grid-container"
				});
				gridContainerRevRef = element.getNodeBySubId({
					subId: "revRef-grid-container"
				});
				configureAttachGrid();
				configureRefGrid();

				$("#dmpicker").on('dmselect', self.onDmSelect);
				$(element.getNodeBySubId({
					subId: "attachmentpicker-info-container"
				})).hide();
			}

			self.getLiEditMode = function () {
				var sc = {
					statusField: null,
					modifyStatus: true,
					modifyOther: true,
					readOnly: false
				};

				if (!detailInfoParams)
					return sc;

				sc.statusField = 'uuu_line_item_status';
				sc.modifyStatus = detailInfoParams.modify_status;

				if (detailInfoDataBean.id != 0 && detailInfoDataBean.task_id == 0) { // existing data
					if (detailInfoParams.modifyitem || detailInfoParams.modify_item) { // modify=true
						if (detailInfoStatusMap && detailInfoStatusMap[detailInfoDataBean[sc.statusField]])
							sc.modifyOther = false;
					} else
						sc.modifyOther = false;
				}
				return sc.modifyOther;
			}

			var configureAttachGrid = function () {
				var gridContainer = element.getNodeBySubId({
					subId: "attachment-grid-container"
				});
				var attachmentNode = $(".attachment-grid", gridContainer)[0];
				self.attachmentGrid = attachmentNode.extend();
				if (self.attachmentGrid != undefined) {
					self.attachmentGrid.showQuickFilter = false;
					self.attachmentGrid.defineRecordKeys({
						numericalId: true
					});
					try {
						self.canRepublish(self.recordInfo.spec.form.params.attach_repub == 1);
						if (self.canRepublish()) {
							dataFields[0].tooltip = U.translate("Publish/Republish to Document Manager");
						}
					} catch (err) {
						self.canRepublish(false);
					}
					self.attachmentGrid.defineColumns(dataFields);
					self.attachmentGrid.setGroupBy("publish_status");
					self.attachmentGrid.groupby[0].sortOrder = "dsc";
					if (self.isReadOnly() == true)
						self.attachmentGrid.defineMenuActions(actionsReadOnly);
					else {
						self.attachmentGrid.defineMenuActions(actions);
					}
					self.attachmentGrid.initDoubleClick(self.attachmentGrid.getControl(), dblClicked);
					self.attachmentGrid.setContextMenuGetAction(function () {
						var esign = getEsignOptions(this.context.records);
						if (this.context.records.length === 1) {
							if (self.isReadOnly() == true) {
								if (self.recordInfo.spec.studio.source == "rfb" && self.recordInfo.config.context.vendorId > 0) {
									return [actFnNamesReadOnly[2]];
								} else if (self.isAutoVueEnabled() == true)
									return actFnNamesReadOnly;
								else
									return [actFnNamesReadOnly[0], actFnNamesReadOnly[2]];
							} else if (self.isAutoVueEnabled() == true) {
								if (self.recordInfo.spec.studio.source == "database" || self.recordInfo.spec.studio.source == "document") {
									if (self.getLiEditMode()) {
										return actFnNames.concat(esign);
									} else {
										return actFnNamesReadOnly;
									}
								} else if (self.recordInfo.spec.studio.source == "rfb" && self.recordInfo.config.context.vendorId > 0) {
									return [actFnNames[2], actFnNames[3], actFnNames[4], actFnNames[5]].concat(esign);
								}
								return actFnNames.concat(esign);
							} else {
								if (self.recordInfo.spec.studio.source == "database" || self.recordInfo.spec.studio.source == "document") {
									if (self.getLiEditMode()) {
										return [actFnNames[0], actFnNames[2], actFnNames[3], actFnNames[4], actFnNames[5]].concat(esign);
									} else {
										return [actFnNamesReadOnly[0], actFnNamesReadOnly[2]];
									}
								} else if (self.recordInfo.spec.studio.source == "rfb" && self.recordInfo.config.context.vendorId > 0) {
									return [actFnNames[2], actFnNames[3], actFnNames[4], actFnNames[5]].concat(esign);
								}
								return [actFnNames[0], actFnNames[2], actFnNames[3], actFnNames[4], actFnNames[5]].concat(esign);
							}
						} else if (this.context.records.length > 1) {
							if (self.isReadOnly() == true) {
								return [actFnNamesReadOnly[2]];
							} else {
								if (self.recordInfo.spec.studio.source == "database" || self.recordInfo.spec.studio.source == "document") {
									if (self.getLiEditMode()) {
										return [actFnNames[2], actFnNames[5]].concat(esign);
									} else {
										return [actFnNamesReadOnly[2]];
									}
								} else if (self.recordInfo.spec.studio.source == "rfb" && self.recordInfo.config.context.vendorId > 0) {
									return [actFnNames[2], actFnNames[5]].concat(esign);
								}
								return [actFnNames[2], actFnNames[5]].concat(esign);
							}
						}
						return [];
					});
					if (self.recordInfo.attachments.is_esign_enabled != undefined && self.recordInfo.attachments.is_esign_enabled == "true")
						self.attachmentGrid.renderGrid(["check_icon", "node_name", "esign_status", "commentsIcon", "revised", "uuu_file_title", "publication_no", "revision_no", "uuu_file_issue_date", "uuu_file_size", "node_path"]);
					else
						self.attachmentGrid.renderGrid(["check_icon", "node_name", "commentsIcon", "revised", "uuu_file_title", "publication_no", "revision_no", "uuu_file_issue_date", "uuu_file_size", "node_path"]);
					// self.attachmentGrid.setSortBy("node_name");
					self.attachmentGrid.getControl().on('grid-rows-selected', function (event, data) {
						self.universalR([]);
						self.universalR(data.selectedRecords);
						if (self.universalR().length == 1 && self.universalR()[0].id > 0) {
							var nodeId = element.getNodeBySubId({
								subId: "revRefTab"
							});
							$(nodeId).ojTabs("option", "selected", 0);
							self.tabChangeHandler();
							self.attachmentID(self.universalR()[0].id);
							if (self.toggleExpand() == true) {
								var previewTab = element.getNodeBySubId({
									subId: "previewBox"
								});
								$(previewTab).ojTabs("option", "selected", 0);
								self.renderPreviewTab();
							}
						}
					});
					self.attachmentGrid.getControl().on('grid-check-clicked', function (event, data) {
						if (data.record.publish == 1) { // Unchecked to checked
							data.record.publish = 0;
							$("#check_" + data.record.id).removeClass("icon-accepted-default icon-checkbox_unselected").addClass("icon-checkbox_selected icon-accepted-default");
							var apiURL = "/bp/studio/share/publish/checkuncheck";
							var postData = {
								publish: 0,
								id: data.record.linknodeid
							};

							U.call(apiURL, postData, function (data) {

							});
						} else { // Checked to unchecked
							data.record.publish = 1;
							$("#check_" + data.record.id).removeClass("icon-checkbox_selected icon-accepted-default").addClass("icon-accepted-default icon-checkbox_unselected");
							var apiURL = "/bp/studio/share/publish/checkuncheck";
							var postData = {
								publish: 1,
								id: data.record.linknodeid
							};

							U.call(apiURL, postData, function (data) {
								// console.log("Data 2: ",data);
							});
						}
					});
					self.attachmentGrid.getControl().on('grid-republish-clicked', function (event, data) {
						if (data.record.publish == 0) { // Unchecked to checked
							data.record.publish = 2;
							$("#check_" + data.record.id).removeClass("icon-accepted-default icon-checkbox_unselected").addClass("icon-checkbox_selected icon-accepted-default");
							var apiURL = "/bp/studio/share/publish/checkuncheck";
							var postData = {
								publish: 2,
								id: data.record.linknodeid
							};

							U.call(apiURL, postData, function (data) {

							});
						} else { // Checked to unchecked
							data.record.publish = 0;
							$("#check_" + data.record.id).removeClass("icon-checkbox_selected icon-accepted-default").addClass("icon-accepted-default icon-checkbox_unselected");
							var apiURL = "/bp/studio/share/publish/checkuncheck";
							var postData = {
								publish: 0,
								id: data.record.linknodeid
							};

							U.call(apiURL, postData, function (data) {
								// console.log("Data 2: ",data);
							});
						}
					});
				}
			}

			var getEsignOptions = function (selectedItems) {
				var esign = [];
				var userId = self.recordInfo.config.context.curruserid;
				if (self.recordInfo.attachments.sign_agent != "NONE") {
					var pending = 0;
					var canRecall = true;
					_.each(selectedItems, function (item, index) {
						var owner = item["create_by"];
						var sender = item["sender_id"];
						if (userId != owner && userId != sender) {
							canRecall = false;
						}
						if (item.sign_status == 1) {
							pending++;
						}
					});

					if (pending != selectedItems.length) {
						esign.push("");
						esign.push(U.translate("Send for E-Signature"));
					}
					if (pending != 0 && canRecall) {
						esign.push("");
						esign.push(U.translate("Recall E-Sign Request"));
					}
				}
				return esign;
			}

			var configureRefGrid = function () {
				var gridContainerRevRef = element.getNodeBySubId({
					subId: "revRef-grid-container"
				});
				var revRefNode = $(".revRef-grid", gridContainerRevRef)[0];
				self.revRefGrid = revRefNode.extend();
				self.revRefGrid.showQuickFilter = false;
				self.revRefGrid.defineColumns(dataFieldsRev);
				self.revRefGrid.defineRecordKeys({
					numericalId: true
				});
				self.revRefGrid.renderGrid(["check_icon2", "node_name", "uuu_comment_type", "xref_status", "version", "upload_date", "file_size", "uuu_create_by", "revision_no", "uuu_file_issue_date"]);
				// self.revRefGrid.setSortBy("node_name");
				self.attGridInitSize();
				self.revRefGrid.getControl().on('grid-check-clicked', function (event, data) {
					if (data.record.publish == 1) {
						data.record.publish = 0;
						$("#check2_" + data.record.id).removeClass("icon-accepted-default icon-checkbox_unselected").addClass("icon-checkbox_selected icon-accepted-default");
						var apiURL = "/bp/studio/share/publish/checkuncheck";
						var postData = {
							publish: 0,
							id: data.record.linknodeid
						};

						U.call(apiURL, postData, function (data) {

						});
					} else {
						data.record.publish = 1;
						$("#check2_" + data.record.id).removeClass("icon-checkbox_selected icon-accepted-default").addClass("icon-accepted-default icon-checkbox_unselected");
						var apiURL = "/bp/studio/share/publish/checkuncheck";
						var postData = {
							publish: 1,
							id: data.record.linknodeid
						};

						U.call(apiURL, postData, function (data) {

						});
					}
				});
			}

			self.activate = function () {
				var elt = context.element;
				var recInfo = self.recordInfo;
				if (self.detailInfo) {
					var currentId = self.detailInfo.selected ? self.detailInfo.selected.id : 0;
					if (self.recordInfo.spec.studio.source == "database" || self.recordInfo.spec.studio.source == "document") {
						detailInfoParams = self.detailInfo.params;
						detailInfoStatusMap = self.detailInfo.line_item_status_map;
						detailInfoDataBean = self.detailInfo.selected;
					}
					if (self.recordInfo.spec.studio.source == "document" && self.detailInfo.tab_id == 0) {
						// loading attachment every time for doc type bp
					} else {
						if (self.currentId == currentId) {
							// re-activate the same line item
							self.attGridInitSize();
							return;
						}
					}
					self.isLineItem(true);
					self.isRecord(false);
					fromLI = true;
					self.hasAttachments(false);
					self.hasMC(false);
					self.hasUF(false);
					self.canRemove(false);
					if (self.recordInfo.spec.studio.source == "document" && self.detailInfo.tab_id == 0) {
						self.hasAttachments(false);
					} else if (self.detailInfo.params.attach_lineitem == 1) {
						if (self.recordInfo.attachments.attachMCLineitem == 1)
							self.hasMC(true);
						if (self.recordInfo.attachments.attachUFLineitem == 1)
							self.hasUF(true);
					}
					if (self.hasUF() == true || self.hasMC() == true)
						self.hasAttachments(true);
					self.currentId = currentId;
				} else {
					self.isLineItem(false);
					self.isRecord(true);
					if (self.recordInfo != undefined) {
						if (self.recordInfo.config.Tabs != undefined) {
							self.hasAttachments(false);
							self.hasMC(false);
							self.hasUF(false);
							self.canRemove(false);
							_.each(self.recordInfo.config.Tabs, function (value, key, list) {
								if (value.label == "Add Attachment")
									self.hasAttachments(true);
								else if (value.label == "My Computer")
									self.hasMC(true);
								else if (value.label == "Unifier Folder")
									self.hasUF(true);
								else if (value.label == "Remove Attachment")
									self.canRemove(true);
							});
							if (self.recordInfo.config.context.currentStepType != "START" && self.recordInfo.attachments.sign_agent !== "NONE" && self.recordInfo.attachments.is_esign_enabled == "true")
								self.hasCP(true);
						}
					}
					if (self.hasUF() == true || self.hasMC() == true)
						self.hasAttachments(true);
				}
				if (self.recordInfo != undefined) {
					contextRecID = self.recordInfo.config.context.rec_id;
					// if(contextRecID != 0)
					//     self.callSilentSave(0);
					contextModel = self.recordInfo.config.context.prefix;
					contextPid = self.recordInfo.config.context.pid;
					sessionBean = self.recordInfo.config.sessionBeanId
					serverUrl = self.recordInfo.attachments.serverUrl;
					var jvueHost = self.recordInfo.config.jvueHost;
					if (jvueHost != null && jvueHost != undefined && jvueHost.indexOf(":") > 0 && jvueHost.indexOf("localhost") == -1)
						self.isAutoVueEnabled(true);
					internalServerEnabled = self.recordInfo.attachments.internalServerEnabled;
					viewertype = self.recordInfo.attachments.viewertype;
					registryprefix = self.recordInfo.attachments.registryprefix;
					srcType = self.recordInfo.attachments.type;
					self.isReadOnly(self.recordInfo.readonly);
					self.URLGenerator();
					//self.isProxy(self.recordInfo.attachments.isproxy);
					if (self.recordInfo.attachments.sign_agent == "NONE")
						self.canSign(false);

					self.loadData();
					if (self.isReadOnly()) // If readonly , cannot attach files .
					{
						self.hasAttachments(false);
					}
				}
				self.attGridInitSize();
			}

			self.URLGenerator = function () {
				if (self.detailInfo != undefined) { // For lineitems
					var currentId = self.detailInfo.selected ? self.detailInfo.selected.id : 0;
					if (self.recordInfo.spec.studio.source == "rfb" && self.recordInfo.config.context.formid == "form.bid.0") {
						dupCheckURL = "/studio/share/filesForDuplicateCheck?parent_id=" + currentId + "&parent_type=" + self.detailInfo.formSpec.prefix + "_bid_lineitem";
						postCompleteURL = "/studio/share/attach_the_files?id_1=" + currentId + "&type_1=" + self.detailInfo.formSpec.prefix + "_bid_lineitem&setlocktype=lineitem&create_dm_linknode=1";
						attachmentURL = "/studio/share/open_attachments?id_1=" + currentId + "&type_1=" + self.detailInfo.formSpec.prefix + "_bid_lineitem&publish_check=bp_attach";
					} else {
						dupCheckURL = "/studio/share/filesForDuplicateCheck?parent_id=" + currentId + "&parent_type=" + self.detailInfo.formSpec.prefix + "_lineitem";
						postCompleteURL = "/studio/share/attach_the_files?id_1=" + currentId + "&type_1=" + self.detailInfo.formSpec.prefix + "_lineitem&setlocktype=lineitem&create_dm_linknode=1";
						attachmentURL = "/studio/share/open_attachments?id_1=" + currentId + "&type_1=" + self.detailInfo.formSpec.prefix + "_lineitem&publish_check=bp_attach";

						if (self.recordInfo.readonly == true || self.recordInfo.terminalStatus[self.recordInfo.upperform.getValues().status]) { //when from lineitem view mode
							attachmentURL += "&view_only=1";
							self.isReadOnly(true);
							self.hasUF(false);
							self.hasMC(false);
						} else
							self.isReadOnly(false);

						if (contextRecID > 0) {
							postCompleteURL += "&createlinkandauditlineitem=1&sourceid=" + contextRecID + "&sourcetype=" + contextModel;
							attachmentURL += "&deletelinkandauditlineitem=1&sourcetype=" + contextModel + "&sourceid=" + contextRecID;
						}

					}

					// var attach_str = "&attach_mc=${attach_mc}&attach_uf=${attach_uf}")
					// attachmentURL += attach_str;

					// if(contextRecID > 0 && ${a} != "form.bid.0")
					//     postCompleteURL += "&createlinkandauditlineitem=1&sourceid="+contextRecID+"&sourcetype="+contextModel;

					// if( self.recordInfo.spec.studio.source == "document") {
					//     if(contextRecID == "0")
					//         dupCheckURL = "/studio/bp/document/filesForDocTypeDuplicateCheck?subtype="+self.detailInfo.subtype+"&model="+contextModel+"&group_id=0"+"&task_clause=1&task_id="+ contextTaskID;
					//     else
					//         dupCheckURL = "/studio/bp/document/filesForDocTypeDuplicateCheck?subtype="+self.detailInfo.subtype+"&model="+contextModel+"&group_id=0"+"&record_id=" + contextRecID;

					//     postCompleteURL+="&linetype=document&model="+ contextModel +"&record_id="+contextRecID+"&task_id="+ contextTaskID+"&group_id=0"
					//     if(contextTaskID)
					//         postCompleteURL += "&task_clause=1";
					// }
				} else if (self.recordInfo != undefined) { // For record
					no_task = 0;
					if (self.isLineItem() == false) {
						if (self.recordInfo.spec.studio.source == "rfb" && self.recordInfo.config.context.formid == "form.bid.0") // rfb bidder for record level
						{
							dupCheckURL = "/studio/share/filesForDuplicateCheck?parent_id=" + contextRecID + "&parent_type=" + contextModel + "_bid";
							postCompleteURL = "/studio/share/attach_the_files?id_1=" + contextRecID + "&type_1=" + contextModel + "_bid&create_dm_linknode=1";
							attachmentURL = "/studio/share/open_attachments?no_task=1&id_1=" + contextRecID + "&type_1=" + contextModel + "_bid&publish_check=bp_attach";

						} else if (self.recordInfo.config.context.no_workflow == true || (srcType != "text" && self.recordInfo.config.context.isRecordEditor == true)) {
							dupCheckURL = "/studio/share/filesForDuplicateCheck?parent_id=" + contextRecID + "&parent_type=" + contextModel;
							postCompleteURL = "/studio/share/attach_the_files?id_1=" + contextRecID + "&type_1=" + contextModel;
							if (self.recordInfo.config.context.formid != "form.bid.0")
								postCompleteURL += "&insert_record_no=" + self.recordInfo.attachments.record_no + "&createlinkandaudit=1&create_dm_linknode=1";

							attachmentURL = "/studio/share/open_attachments?no_task=1&id_1=" + contextRecID + "&type_1=" + contextModel + "&commentfrom=fc&publish_check=bp_attach";
							no_task = 1;
							if (srcType == "text") {
								dupCheckURL = "/studio/share/filesForDuplicateCheck?parent_id=" + sessionBean + "&parent_type=login_session&for_additional_clause=" + contextModel + "_" + contextRecID + "_comments";
								postCompleteURL = "/studio/share/attach_the_files?id_1=" + sessionBean + "&type_1=login_session&for_additional_clause=" + contextModel + "_" + contextRecID + "_comments&skiplock=1&create_dm_linknode=1";
								attachmentURL = "/studio/share/open_attachments?id_1=" + sessionBean + "&type_1=login_session&for_additional_clause=" + contextModel + "_" + contextRecID + "_comments&publish_check=bp_attach";
								no_task = 0;
							}
						} else {
							if (contextTaskID == undefined)
								contextTaskID = self.recordInfo.config.context.task_id;
							if (contextRecID == 0) { //WF and 1st time
								if (contextTaskID == undefined)
									contextTaskID = self.recordInfo.config.context.task_id;
								dupCheckURL = "/studio/share/filesForDuplicateCheck?parent_id=" + contextTaskID + "&parent_type=task";
								postCompleteURL = "/studio/share/attach_the_files?id_1=" + contextTaskID + "&type_1=task&create_dm_linknode=1";

								attachmentURL = "/studio/share/open_attachments?id_1=" + contextTaskID + "&type_1=task&srcid=0&_taskid=" + contextTaskID + "&model=" + contextModel + "&commentfrom=fc&publish_check=bp_attach";
							} else {
								if (contextTaskID > 0) {
									dupCheckURL = "/studio/share/filesForDuplicateCheck?multiple_objects=1&process_id=" + self.recordInfo.config.context.process_id + "&task_node_id=" + self.recordInfo.config.context.task_node_id + "&recordid=" + contextRecID + "&model=" + contextModel;
									postCompleteURL = "/studio/share/attach_the_files?process_id=" + self.recordInfo.config.context.process_id + "&task_node_id=" + self.recordInfo.config.context.task_node_id + "&multiple_objects=1&id_1=" + contextRecID + "&type_1=" + contextModel + "&id_2=" + contextTaskID + "&type_2=task&create_dm_linknode=1";

									attachmentURL = "/studio/share/open_attachments?multiple_objects=1&id_1=" + contextRecID + "&type_1=" + contextModel + "&id_2=" + contextTaskID + "&type_2=task&srcid=" + contextRecID + "&_taskid=" + contextTaskID + "&model=" + contextModel + "&commentfrom=fc&publish_check=bp_attach";
									if (srcType == "text") {
										dupCheckURL = "/studio/share/filesForDuplicateCheck?parent_id=" + contextTaskID + "&parent_type=task";
										postCompleteURL = "/studio/share/attach_the_files?id_1=" + contextTaskID + "&type_1=task&create_dm_linknode=1";
										attachmentURL = "/studio/share/open_attachments?id_1=" + contextTaskID + "&type_1=task&srcid=" + contextRecID + "&_taskid=" + contextTaskID + "&model=" + contextModel + "&commentfrom=fc&publish_check=bp_attach";
									}
								} else {
									dupCheckURL = "/studio/share/filesForDuplicateCheck?parent_id=" + contextRecID + "&parent_type=" + contextModel;
									postCompleteURL = "/studio/share/attach_the_files?id_1=" + contextRecID + "&type_1=" + contextModel + "&insert_record_no=" + self.recordInfo.attachments.record_no + "&createlinkandaudit=1&create_dm_linknode=1";

									attachmentURL = "/studio/share/open_attachments?id_1=" + contextRecID + "&type_1=" + contextModel + "&commentfrom=fc&publish_check=bp_attach";

									if (self.recordInfo.config.context.isRecordEditor == false)
										attachmentURL += "&view_only=1";

									if (self.recordInfo.config.context.isRecordEditor == true || (self.recordInfo.config.context.currentSteptype == "END" && self.recordInfo.attachments.k__creator_id != self.recordInfo.config.context.curruserid && self.recordInfo.config.context.readonly == false)) {
										attachmentURL = "/studio/share/open_attachments?no_task=1&id_1=" + contextRecID + "&type_1=" + contextModel + "&commentfrom=fc&publish_check=bp_attach";
										no_task = 1;
									}
								}
							}
						}
					}
				}
			}

			U.Event.subscribe('record_id_changed', function (data) {
				contextRecID = data[0];
				if (self.recordInfo != undefined)
					self.recordInfo.attachments.record_no = data[1];
				self.URLGenerator();
			});

			U.Event.subscribe('task_id_changed', function (data) {
				contextTaskID = data;
				self.URLGenerator();
			});

			U.Event.subscribe('attachments-tabs-resize', function (data) {
				self.attGridInitSize();
			});

			var windowHeight;

			U.Event.subscribe('record-tabs-resize', function (data) {
				self.subscribedHeight(data.height);
				windowHeight = data.height;
				self.attGridInitSize();
			});
			U.Event.subscribe('attachment_log_refresh', function () {
				self.refreshViewData();
			});

			self.attGridInitSize = function () {
				if (!self.attachmentGrid) {
					return;
				}
				// var w = $(gridContainer).width();
				// if(!w) return;
				// var h = (self.subscribedHeight() - 225);
				// if(!h) return;
				// if(self.attachmentGrid)
				//     self.attachmentGrid.resizeGrid(w, h);
				// if(self.revRefGrid)
				//     self.revRefGrid.resizeGrid(w, h);

				var elem = self.attachmentGrid.getElement();
				var parent = elem.parent();
				var heightoffset = 150; // top ? top : 0
				var widthoffset = 30;
				var gridContainer = element.getNodeBySubId({
					subId: "attachment-grid-container"
				});
				var attachmentNode = $(".attachment-grid", gridContainer)[0];
				// debugger;
				if (parent.width() > 1000) {
					self.attachmentGrid.resizeGrid((parent.width() / 2 - widthoffset), (self.subscribedHeight() / 2) - heightoffset);
					self.revRefGrid.resizeGrid((parent.width() / 2 - widthoffset), (self.subscribedHeight() / 2) - heightoffset);
					self.toggleExpand(true);
					if (self.universalR() != undefined) {
						var prevBox = element.getNodeBySubId({
							subId: "previewBox"
						});
						$(element.getNodeBySubId({
							subId: "previewBox"
						})).show();
						var yh = parent.height();
						if (self.isReadOnly() == false) {
							if (yh > 40 && yh <= 45)
								prevBox.style.marginTop = "-210px";
							else if (yh > 45 && yh <= 50)
								prevBox.style.marginTop = "-220px";
							else if (yh > 50 && yh <= 55)
								prevBox.style.marginTop = "-230px";
							else if (yh > 55 && yh <= 60)
								prevBox.style.marginTop = "-240px";
							else if (yh > 60 && yh <= 65)
								prevBox.style.marginTop = "-250px";
							else if (yh > 65 && yh <= 70)
								prevBox.style.marginTop = "-260px";
							else if (yh > 70 && yh <= 75)
								prevBox.style.marginTop = "-270px";
							else if (yh > 75 && yh <= 80)
								prevBox.style.marginTop = "-280px";
							else if (yh > 80 && yh <= 85)
								prevBox.style.marginTop = "-290px";
							else if (yh > 85 && yh <= 90)
								prevBox.style.marginTop = "-300px";
							else if (yh > 90 && yh <= 95)
								prevBox.style.marginTop = "-310px";
							else if (yh > 95 && yh <= 100)
								prevBox.style.marginTop = "-320px";
							else if (yh > 100 && yh <= 105)
								prevBox.style.marginTop = "-330px";
							else if (yh > 105 && yh <= 110)
								prevBox.style.marginTop = "-340px";
							else if (yh > 110 && yh <= 115)
								prevBox.style.marginTop = "-350px";
							else if (yh > 115 && yh <= 120)
								prevBox.style.marginTop = "-360px";
							else if (yh > 120 && yh <= 125)
								prevBox.style.marginTop = "-370px";
							else if (yh > 125 && yh <= 130)
								prevBox.style.marginTop = "-380px";
							else if (yh > 130 && yh <= 135)
								prevBox.style.marginTop = "-390px";
							else if (yh > 135 && yh <= 140)
								prevBox.style.marginTop = "-400px";
							else if (yh > 140 && yh <= 145)
								prevBox.style.marginTop = "-410px";
							else if (yh > 145 && yh <= 150)
								prevBox.style.marginTop = "-420px";
							else if (yh > 150 && yh <= 155)
								prevBox.style.marginTop = "-430px";
							else if (yh > 155 && yh <= 160)
								prevBox.style.marginTop = "-440px";
							else if (yh > 160 && yh <= 165)
								prevBox.style.marginTop = "-450px";
							else if (yh > 165 && yh <= 170)
								prevBox.style.marginTop = "-460px";
							else if (yh > 170 && yh <= 175)
								prevBox.style.marginTop = "-470px";
							else if (yh > 175 && yh <= 180)
								prevBox.style.marginTop = "-480px";
							else if (yh > 180 && yh <= 185)
								prevBox.style.marginTop = "-490px";
							else if (yh > 185 && yh <= 190)
								prevBox.style.marginTop = "-500px";
							else if (yh > 190 && yh <= 195)
								prevBox.style.marginTop = "-510px";
							else if (yh > 195 && yh <= 200)
								prevBox.style.marginTop = "-520px";
							else if (yh > 200 && yh <= 205)
								prevBox.style.marginTop = "-530px";
							else if (yh > 205 && yh <= 210)
								prevBox.style.marginTop = "-540px";
							else if (yh > 210 && yh <= 215)
								prevBox.style.marginTop = "-550px";
							else if (yh > 215 && yh <= 220)
								prevBox.style.marginTop = "-560px";
							else if (yh > 220 && yh <= 225)
								prevBox.style.marginTop = "-570px";
							else if (yh > 225 && yh <= 230)
								prevBox.style.marginTop = "-580px";
							else if (yh > 230 && yh <= 235)
								prevBox.style.marginTop = "-590px";
							else if (yh > 235 && yh <= 240)
								prevBox.style.marginTop = "-600px";
							else if (yh > 240 && yh <= 245)
								prevBox.style.marginTop = "-610px";
							else if (yh > 245 && yh <= 250)
								prevBox.style.marginTop = "-620px";
							else if (yh > 250 && yh <= 255)
								prevBox.style.marginTop = "-630px";
							else if (yh > 255 && yh <= 260)
								prevBox.style.marginTop = "-640px";
							else if (yh > 260 && yh <= 265)
								prevBox.style.marginTop = "-650px";
							else if (yh > 265 && yh <= 270)
								prevBox.style.marginTop = "-660px";
							else if (yh > 270 && yh <= 275)
								prevBox.style.marginTop = "-670px";
							else if (yh > 275 && yh <= 280)
								prevBox.style.marginTop = "-680px";
							else if (yh > 280 && yh <= 285)
								prevBox.style.marginTop = "-690px";
							else if (yh > 285 && yh <= 290)
								prevBox.style.marginTop = "-700px";
							else if (yh > 290 && yh <= 295)
								prevBox.style.marginTop = "-710px";
							else if (yh > 295 && yh <= 300)
								prevBox.style.marginTop = "-720px";
							else if (yh > 300 && yh <= 305)
								prevBox.style.marginTop = "-730px";
							else if (yh > 305 && yh <= 310)
								prevBox.style.marginTop = "-740px";
							else if (yh > 310 && yh <= 315)
								prevBox.style.marginTop = "-750px";
							else if (yh > 315 && yh <= 320)
								prevBox.style.marginTop = "-760px";
							else if (yh > 320 && yh <= 325)
								prevBox.style.marginTop = "-770px";
							else if (yh > 325 && yh <= 330)
								prevBox.style.marginTop = "-780px";
							else if (yh > 330 && yh <= 335)
								prevBox.style.marginTop = "-790px";
							else if (yh > 335)
								prevBox.style.marginTop = "-800px";
						} else if (self.isReadOnly() == true) {
							if (yh > 40 && yh <= 45)
								prevBox.style.marginTop = "-200px";
							else if (yh > 45 && yh <= 50)
								prevBox.style.marginTop = "-210px";
							else if (yh > 50 && yh <= 55)
								prevBox.style.marginTop = "-220px";
							else if (yh > 55 && yh <= 60)
								prevBox.style.marginTop = "-230px";
							else if (yh > 60 && yh <= 65)
								prevBox.style.marginTop = "-240px";
							else if (yh > 65 && yh <= 70)
								prevBox.style.marginTop = "-250px";
							else if (yh > 70 && yh <= 75)
								prevBox.style.marginTop = "-260px";
							else if (yh > 75 && yh <= 80)
								prevBox.style.marginTop = "-270px";
							else if (yh > 80 && yh <= 85)
								prevBox.style.marginTop = "-280px";
							else if (yh > 85 && yh <= 90)
								prevBox.style.marginTop = "-290px";
							else if (yh > 90 && yh <= 95)
								prevBox.style.marginTop = "-300px";
							else if (yh > 95 && yh <= 100)
								prevBox.style.marginTop = "-310px";
							else if (yh > 100 && yh <= 105)
								prevBox.style.marginTop = "-320px";
							else if (yh > 105 && yh <= 110)
								prevBox.style.marginTop = "-330px";
							else if (yh > 110 && yh <= 115)
								prevBox.style.marginTop = "-340px";
							else if (yh > 115 && yh <= 120)
								prevBox.style.marginTop = "-350px";
							else if (yh > 120 && yh <= 125)
								prevBox.style.marginTop = "-360px";
							else if (yh > 125 && yh <= 130)
								prevBox.style.marginTop = "-370px";
							else if (yh > 130 && yh <= 135)
								prevBox.style.marginTop = "-380px";
							else if (yh > 135 && yh <= 140)
								prevBox.style.marginTop = "-390px";
							else if (yh > 140 && yh <= 145)
								prevBox.style.marginTop = "-400px";
							else if (yh > 145 && yh <= 150)
								prevBox.style.marginTop = "-410px";
							else if (yh > 150 && yh <= 155)
								prevBox.style.marginTop = "-420px";
							else if (yh > 155 && yh <= 160)
								prevBox.style.marginTop = "-430px";
							else if (yh > 160 && yh <= 165)
								prevBox.style.marginTop = "-440px";
							else if (yh > 165 && yh <= 170)
								prevBox.style.marginTop = "-450px";
							else if (yh > 170 && yh <= 175)
								prevBox.style.marginTop = "-460px";
							else if (yh > 175 && yh <= 180)
								prevBox.style.marginTop = "-470px";
							else if (yh > 180 && yh <= 185)
								prevBox.style.marginTop = "-480px";
							else if (yh > 185 && yh <= 190)
								prevBox.style.marginTop = "-490px";
							else if (yh > 190 && yh <= 195)
								prevBox.style.marginTop = "-500px";
							else if (yh > 195 && yh <= 200)
								prevBox.style.marginTop = "-510px";
							else if (yh > 200 && yh <= 205)
								prevBox.style.marginTop = "-520px";
							else if (yh > 205 && yh <= 210)
								prevBox.style.marginTop = "-530px";
							else if (yh > 210 && yh <= 215)
								prevBox.style.marginTop = "-540px";
							else if (yh > 215 && yh <= 220)
								prevBox.style.marginTop = "-550px";
							else if (yh > 220 && yh <= 225)
								prevBox.style.marginTop = "-560px";
							else if (yh > 225 && yh <= 230)
								prevBox.style.marginTop = "-570px";
							else if (yh > 230 && yh <= 235)
								prevBox.style.marginTop = "-580px";
							else if (yh > 235 && yh <= 240)
								prevBox.style.marginTop = "-590px";
							else if (yh > 240 && yh <= 245)
								prevBox.style.marginTop = "-600px";
							else if (yh > 245 && yh <= 250)
								prevBox.style.marginTop = "-610px";
							else if (yh > 250 && yh <= 255)
								prevBox.style.marginTop = "-620px";
							else if (yh > 255 && yh <= 260)
								prevBox.style.marginTop = "-630px";
							else if (yh > 260 && yh <= 265)
								prevBox.style.marginTop = "-640px";
							else if (yh > 265 && yh <= 270)
								prevBox.style.marginTop = "-650px";
							else if (yh > 270 && yh <= 275)
								prevBox.style.marginTop = "-660px";
							else if (yh > 275 && yh <= 280)
								prevBox.style.marginTop = "-670px";
							else if (yh > 280 && yh <= 285)
								prevBox.style.marginTop = "-680px";
							else if (yh > 285 && yh <= 290)
								prevBox.style.marginTop = "-690px";
							else if (yh > 290 && yh <= 295)
								prevBox.style.marginTop = "-700px";
							else if (yh > 295 && yh <= 300)
								prevBox.style.marginTop = "-710px";
							else if (yh > 300 && yh <= 305)
								prevBox.style.marginTop = "-720px";
							else if (yh > 305 && yh <= 310)
								prevBox.style.marginTop = "-730px";
							else if (yh > 310 && yh <= 315)
								prevBox.style.marginTop = "-740px";
							else if (yh > 315 && yh <= 320)
								prevBox.style.marginTop = "-750px";
							else if (yh > 320 && yh <= 325)
								prevBox.style.marginTop = "-760px";
							else if (yh > 325 && yh <= 330)
								prevBox.style.marginTop = "-770px";
							else if (yh > 330 && yh <= 335)
								prevBox.style.marginTop = "-780px";
							else if (yh > 335)
								prevBox.style.marginTop = "-790px";
						}
						if (self.universalR().length > 0) {
							self.renderPreviewTab();
						}
					}

				} else {
					self.attachmentGrid.resizeGrid(parent.width(), (self.subscribedHeight()) - 250);
					self.toggleExpand(false);
				}
			}
			/*self.notifyResize = _.debounce(function(data) {
			    var h = windowHeight;
			    if (!h) return;
			    if(self.attachmentGrid) {
			        self.attachmentGrid.getElement().parent().height(h);
			        self.initSize();
			    }
			    if(self.revRefGrid) {
			        self.revRefGrid.getElement().parent().parent().height(h);
			        self.revRefGrid.initSize();
			    }
			},200);*/

		};
		return attachmentModel;

	});