/*
- record.js

*/
define(['underscore',
        'knockout',
        'ojs/ojcore',
		'../../modules/bp/lineitem',
		'../../modules/comp/bindings',
		'../bp/picker',
		'../bp/inviteBids',
		'../bp/cancelReservation',
		'../comp/picker/usergroup',
		'../comp/picker/multiusers',
		'../comp/picker/userprofile',
		'../comp/picker/trancurrency',
		'../bp/cashFlowCreationMethod',
		'../bp/ytbafcCredit',
        'ojs/ojknockout',
		'ojs/ojtabs',
		'ojs/ojdialog',
		'ojs/ojknockout-validation',
		'../../modules/comp/record/loader',
		'../../modules/comp/main/loader',
        '../../modules/comp/form/loader',
    	'../../modules/comp/log/loader',
    	'../../modules/comp/record/lineItemsConsolidation',
    	'../../modules/comp/record/groupLineItems',
    	'../../modules/comp/review/loader',
    	'../comp/form/bidPickerField'
    ],
function(_, ko, oj, LiBean, bindings) {

  function RecordModel(PPP) {

	var self = this;
    self.spec = PPP.spec; // for template binding
    if (self.spec && self.spec.studio)
		self.no_workflow = self.spec.studio.no_workflow; // for binding

    self.payload = {}; // for submit
    self.contextReady = false;
    self.expandBtnLabel = ko.observable(U.translate("Maximize"));
    self.isShowBidsTemplate = ko.observable(true);
    var recordInfo = {};
	var pickedLinkId = 0;
	var selectedWF = {};
	var defaultTaskDueDate;
	var autoCreateList = [];
	var ace = {};
	var errorListViewGrid;
	var isCloseClick = false;
	var isSendClick = false;
	var isTerminateClick = false;
	var isAcceptTaskClick = false;
	var isEditTaskClick = false;
	var isBidButtonClick = false;
	var isInviteButtonClick = false;
	var triggerFrom = "";
	var recordAttachCount = 0;
	var rfbRecordNumber=0;
	var configuration; 
	var bidderwin;

	self.isValidateLineitem = false;
	self.delLineIds = "";
	self.delTabIds = [];
	self.hideAuditLog = ko.observable(false);
	self.hideReferenceRecords = ko.observable(false);
	self.hideSpaceContent = ko.observable(false);
	self.formTitle = ko.observable(U.translate("Edit Record"));
	self.recordRightTab = null;
  	self.sign=ko.observable(true);
	self.current_record = ko.observable("Pass the Current Record id here");
	self.imgSignatureMap = PPP.signatureMap ? PPP.signatureMap : {};
    // self.moduleSettings_recordAttachment = { name: "bp/recordAttachment", params: self.current_record};
    // self.moduleSettings_recordComment = { name: "bp/recordComment", params: self.current_record};
    //self.moduleSettings_linkedRecords = { name: "bp/linkedRecords", params: {parent: self, PPP: PPP}};
	//self.moduleSettings_linkedMails = { name: "bp/linkedMails", params: PPP};
    //self.moduleSettings_auditLog = { name: "bp/auditLog", params: self.current_record};
    self.toolButtons =  ko.observableArray([]);
    self.menuActions =  ko.observableArray([]);
    self.context = ko.observable({});
    self.errorCount = ko.observable(0);
	self.paymentalertmsg = ko.observable("");
	self.paymentmsgbtn = ko.observable(false);
	
    self.btnSubmit = ko.observable(false);
    self.btnBidSubmit = ko.observable(false);
    self.btnBidDraft = ko.observable(false);
    self.btnEdit = ko.observable(false);
	self.btnViewWF = ko.observable(false);
    self.btnSend = ko.observable(false);
	self.btnComplete = ko.observable(false);
    self.btnSave = ko.observable(false);
    self.btnAccept = ko.observable(false);
    self.btnDecline = ko.observable(false);
    self.btnClose = ko.observable(false);
    self.btnError = ko.observable(false);
    self.btnDelAllLines = ko.observable(false);
    self.btnReview = ko.observable(false);
	self.printoption  = new U.PrintOption();
	self.customPrintView = new U.CustomPrint();
	self.showCustomPrint = ko.observable(false);
	
	
	self.isPortalEnabled = ko.observable(PPP.isPortalEnabled === true);
	self.format = ko.observable(2);
	self.isBulkPrint = ko.observable(false);
	self.isNotifyUsersEnabled = ko.observable(false);
	self.hideWorkflowProgress = ko.observable(false);
	self.errorFrom = "upper";
	self.upkHelpApp      = ko.observable("");
    self.bpHelpStr       = ko.observable("");
    self.upkHelpURL      = ko.observable("");
    self.sessionBeanId      = ko.observable("");
    self.republishErrors =  ko.observableArray([]);
    self.isRepublishCopy =  ko.observable(false);
    self.isRepublishMove =  ko.observable(false);
    self.republishMessage =  ko.observable("");

	self.isTemplate = false;
	self.templateStatus = "Draft";
	var shellCreationValDone = false;
	self.wfMenu = ko.observableArray();
	self.showIstepWfMenu = ko.observable(false);
    self.mapServerInfo = PPP['map_server_info'];
    self.serverErrors = [];
    self.validateForm = [];
    self.currentTabId = "";
    self.showLinkedMail = ko.observable(false);
    self.createRecWindowName    = ko.observable("");
    self.createNewRecordDialog = new U.CreateNewRecordDialog(PPP);
    self.currencyLabel = ko.observable(U.translate('View Currency'));
  	var errorgridConfig;
  	self.selectedCurrencyId = ko.observable("0");
  	self.selectedCurrencySymbol = ko.observable();
  	self.baseCurrecySymbol = ko.observable();
  	self.transactionCurrencySymbol = ko.observable();
  	self.showViewCurrency = ko.observable(false);
  	self.displayRate = 1.0;
  	self.bclick = "";
  	self.vendorId = PPP.vendorId;
    var winningBidExists = false;
  	//self.isProxy = ko.observable(PPP.isproxy);
  	self.currencyOptions = [
  		{value: "0", label: U.translate('Transaction Currency')},
  		{value: "1", label: U.translate('Project Currency')}
  	];
  	self.commentsByOptions = [
        {value: "0", label: U.translate('All')}
    ];
	self.helpMenuItems = [
                          {text: self.bpHelpStr, action: function(){ self.CustomHelp() } },
                          {text: U.translate('User Productivity Kit'), action: function(){ self.openUpkWindow()} }
                      ];
    var errogridFields =  {
		    "errortype":
		    {
		      //"dataType":"string",
		      "width":40,
		      "id":"errortype",
		      "title": " ",
		      sortable: false,
		      hideable: false,
		      menu: false,
		      resizable: false,
		      draggable: false,
		      align: "center",
		      tooltip: U.translate("Error Type"),
		      rendererFns: {
	            getValueMarkup : function (msgtype) {
	                if(msgtype.record.errortype == "warning") {
	                    return "<i title='" + U.translate("Warning") + "' class='pgbu-icon icon-warning-filled' style='color:#ffcc00;'></i>";
	                }
	                else {
	                    return "<i title='" + U.translate("Error") + "' class='pgbu-icon icon-ClosedItem' style='color:red;'></i>";
	                }
	            }
	           }
		    },
		    "errorlocation":
		    {
		      "dataType":"string",
		      "width":200,
		      "id":"errorlocation",
		      "title":U.translate("Error Location"),
		      sortable: false,
		      hideable: false,
		      menu: false,
		      resizable: true,
		      draggable: false,
		      rendererFns: {
			      getValueMarkup : function (msgtype) {
	                  var markup = '<span title="' + htmlEncoder(msgtype.record.errorlocation) + '">' +  msgtype.record.errorlocation + '</span>';
	            	  return markup;

			      }
		      }
		    },
		    "description":
		    {
		      "dataType":"string",
		      "width":340,
		      "id":"description",
		      "title":U.translate("Description"),
		      sortable: false,
		      hideable: false,
		      menu: false,
		      resizable: true,
		      draggable: false,
		      rendererFns: {
		            getValueMarkup : function (msgtype) {
		            	  var markup = '<span title="' + htmlEncoder(msgtype.record.description) + '">' +  msgtype.record.description + '</span>';
		            	  return markup;
		            }
		    }
		    }
    };


    var htmlEncoder = function(str) {
        if (str == null)
            return ("");

        var result="";
           for (var i = 0; i < str.length; i++)
            {
               switch (str.substring(i,i+1))
                {
                    case '"':
                        result += '&quot;';
                        break;
                    case "'":
                        result += "\'";
                        break;
                    case '<':
                        result += '&lt;';
                        break;
                    case '>':
                        result += '&gt;';
                        break;
                    default:
                        result += str.substring(i,i+1);
                        break;
                }
            }
        return (result);
    };

	self.erroritems = [];
	var errorgridConfig;

	self.internalUpdateHandler = function(e) {
		self.setValidationForm(upperform,"upper");
		self.getErrorControl(true); // has the side-effect of showing the error icon next to send button
	}
	
	//var height = $(window).height() - 133;
	//height = height > 100 ? height : 100;
	//gridConfig.json.layout().height = height + "px";

	self.task_due_info =  ko.observable(U.translateMessage("task_due_info"));

    // Wait until the composite is ready before loading data
    var upperform, actionDetail, taskDetail, notifyAdditional;
	window.isTopWindow = true;
	self.gridData = ko.observableArray([]);
	self.showTaskDueDate = ko.observable(false);
	self.showTaskInfo = ko.observable(false);
	self.showDueDate = ko.observable(false);
	self.showCC = ko.observable(true);
	self.showTo = ko.observable(true);
	self.showLate = ko.observable(false);
	self.showSendButton = ko.observable(false);
	self.workflowLabels = {
		'workflow_actions' : U.translate('Workflow Actions') ,
		'send_for': U.translate('Send For'),
		'sent_for': U.translate('Sent For'),
		'from': U.translate('From'),
		'to': U.translate('To'),
		'cc': U.translate('CC'),
		'task_due_date': U.translate('Task Due Date')
	};
	self.sendButtonLabel = ko.observable(U.translate("Send"));
	self.cancelButtonLabel = ko.observable(U.translate("Cancel"));
	var clickSStep = false;
	self.autoCreateCount = ko.observable(0);

	var columns = [
		{name: 'name', label: U.translate('Name'), readOnly: true},
		{name: 'company_name', label: U.translate('Company Name'), readOnly: true},
		{name: 'task_due_date', label: U.translate('Task Due Date'), readOnly: true, dataType: 'datetime', formatter: U.DateTimeConverter}
	]
	self.tempSnapShot = {};
    oj.Context.getPageContext().getBusyContext().whenReady().then(function () {
             	if (PPP.errorKey) {
             		U.AlertByKey(PPP.errorKey);
             		return;
             	}
		upperform = document.getElementById("formUpper");
		if(PPP.bpolineexists) {
		    upperform.extend().bpolineexists = PPP.bpolineexists;
		}
		$.extend(recordInfo,
		        {config: PPP.config,
		         unchanged: true,
		         upperform: upperform,
		         silentSave: self.silentSave,
		         requireSilentSave: self.requireSilentSave,
		         getDraft: self.getDraft,
				 displayErrorList: self.displayErrorList,
				 getErrorControl: self.getErrorControl,
				 btnError: self.btnError,
		         lineItemStatusMap:self.spec.form.line_item_status_map,
		         comments: {},
		         setValidationForm :self.setValidationForm,
		         attachments: {},
		         moveTogroup :self.detailAction.moveToGroup,
		         AddToGroup :self.detailAction.AddToGroup,
		         deployLineButtons:self.deployButtons,
		         imgSignatureMap: self.imgSignatureMap,
		         spec: self.spec,
		         canAddCostLineItem:self.canAddCostLineItem,		         
		         showViewCurrency: self.showViewCurrency,
		         txtDraftFileAttachments:PPP.txtDraftFileAttachments,
		         draftObj:PPP.data.draft});
		if(recordInfo.config.context.isTemplate)
			self.isTemplate = recordInfo.config.context.isTemplate;
		if(recordInfo.config.context.templateStatus)
			self.templateStatus = recordInfo.config.context.templateStatus;

		if(self.isTemplate) {
			if(self.templateStatus == "Draft") {
				self.sendButtonLabel(U.translate("Save"));
			} else{
				self.cancelButtonLabel(U.translate("Close"));
			}
		}

		if(self.spec.form.params) {
			recordInfo.attachments.attachMCLineitem = self.spec.form.params.attach_mc;
			recordInfo.attachments.attachUFLineitem = self.spec.form.params.attach_uf;
			recordInfo.config.mail.linkmail =self.spec.form.params.linked_umail;
		}
		recordInfo.attachments.type = self.spec.studio.source;
		recordInfo.attachments.serverUrl = recordInfo.config.serverUrl;
		recordInfo.attachments.jvueHost = recordInfo.config.jvueHost;
		recordInfo.attachments.internalServerEnabled = recordInfo.config.internalServerEnabled;
		recordInfo.attachments.viewertype = recordInfo.config.viewertype;
		recordInfo.attachments.registryprefix = recordInfo.config.registryprefix;
		recordInfo.attachments.record_no = PPP.data.upper.record_no;
		recordInfo.attachments.k__creator_id = PPP.data.upper.k__creator_id;
		recordInfo.comments.k__creator_id = PPP.data.upper.k__creator_id;
		//recordInfo.attachments.isproxy = PPP.isproxy;
		recordInfo.attachments.sign_agent = PPP.sign_agent;
		if(PPP.sign_agent=='NONE')
			recordInfo.attachments.is_esign_enabled='false';
		else
		recordInfo.attachments.is_esign_enabled=PPP.is_esign_enabled;
		var hideQueryTab = false;
		if (recordInfo.config.context.rec_id === 0)
			hideQueryTab = true;
		upperform.extend().taskId = recordInfo.config.context.task_id;

		if(PPP.data.workflow)
		{
			recordInfo.comments.record_no = PPP.data.upper.record_no;
			recordInfo.comments.task_status = PPP.data.workflow.task_status;
			if(PPP.data.workflow.istep === true)
			{
				recordInfo.comments.cc_add_allowed = 0;
				recordInfo.comments.delete_comments = 0;
				recordInfo.comments.hide_comments = 0;
				hideQueryTab = true;
			}
			else if(PPP.data.workflow.currentStep.name == "Creation")
			{
				recordInfo.comments.cc_add_allowed = "true";
				recordInfo.comments.delete_comments = "true";
				recordInfo.comments.hide_comments = "true";
				hideQueryTab = true;
			}
			else
			{
				recordInfo.comments.cc_add_allowed = PPP.data.workflow.currentStep.cc_add_allowed;
				recordInfo.comments.delete_comments = PPP.data.workflow.currentStep.delete_comments;
				recordInfo.comments.hide_comments = PPP.data.workflow.currentStep.hide_comments;
			}
		}

		if (hideQueryTab && self.spec.form.bp_tab) {
			_.each(self.spec.form.bp_tab, function(tab){
				if (tab.type == "queryTab")
					tab.visible(false);
			});
		}

		recordInfo.readonly = recordInfo.config.context.readonly;
		recordInfo.isPortalEnabled = PPP.isPortalEnabled;
		recordInfo.disableViewOnly = PPP.disableViewonly;
		recordInfo.activeProjectBp = PPP.activeProjectBp;
		recordInfo.terminalStatus = self.spec.studio.terminal_status;
		
		//setting terminalstate
		recordInfo.terminalState = false;
		var recStatus = "";
		if(typeof(PPP.data.upper.status)!="undefined")
			recStatus = PPP.data.upper.status;		
		if(PPP.data.workflow){
			if(recordInfo.terminalStatus[recStatus])
				recordInfo.terminalState = true;
		}		
		else{
			if(recordInfo.terminalStatus[recStatus]){
				if(PPP.config.context.rec_id == 0 && PPP.config.context.processStatus == 0)
					recordInfo.terminalState = false;
				else
					recordInfo.terminalState = true;				
			}								
		}						
		
		recordInfo['tabDetailsMaximized'] = [];		
		self.loadConfiguration(recordInfo.config);
		self.loadWFConfig(recordInfo.config);
    	self.forReviewRecordInfo = recordInfo;
    	$( "#newMenu" ).ojMenu( "refresh" );
		oj.Context.getContext(upperform).getBusyContext().whenReady().then(self.reloadData);

		if(recordInfo.config.context.bpSendComplete) {
			self.viewWF();
		}

		if(PPP.data.workflow)
		self.forReviewWFObj = PPP.data.workflow;
		if(recordInfo.config.context.rec_id!=undefined && recordInfo.config.context.rec_id > 0){
		console.log(recordInfo);
           upperform.extend().recbpid=recordInfo.config.context.rec_id;
        }

		if(recordInfo.config.context.readonly != null && typeof recordInfo.config.context.readonly != "undefined"){
			var context = recordInfo.config.context;
			var edit_form = false;
			if(!context.readonly)
				edit_form = true;
			upperform.extend().edit_reservation_calendar=edit_form;
			upperform.extend().recordSelf=self;
		}

		
		if (taskDetail = document.getElementById("taskDetail"))
			oj.Context.getContext(taskDetail).getBusyContext().whenReady().then(loadTaskDetail);

		if(self.spec.studio.subtype == "shell_creation") {
			recordInfo.isShellCreation = true;
			upperform.addEventListener("shell-location-change", function(event) {
				self.handleShellLocationChange();
			});

			upperform.addEventListener("shell-template-change", function(event) {
				self.handleShellTemplateChange();
			});
		}

		if(recordInfo.config.context.rec_id > 0 && self.spec.studio.source == "cost"){
			self.disableProjCostRateField(true);
			self.disableBaseCostRateField(true);
	    		upperform.extend().setBprecid(recordInfo.config.context.rec_id);
		}

		if(self.spec.studio.source == "cost"){//recordInfo.config.context.rec_id === 0 &&
			if(recordInfo.config.context.p_currencyid > 0){
				upperform.extend().initcurrencyobj = PPP.data.currencyMap[recordInfo.config.context.p_currencyid];
			}

			if(upperform.getField("refid")) {

				upperform.getField("refid").getControl().on({
					'valueChanged': function () {
						if(PPP.spec.studio.type == "payment" && recordInfo.config.context.rec_id == 0) {
							recordInfo.config.context.uuu_content_id = 0;
							var paymentParamsMap = {};
							paymentParamsMap["recordid"] = 0; 
							paymentParamsMap["pref"] = recordInfo.config.context.prefix;
							if(recordInfo.config.context.rec_id != undefined
									&& recordInfo.config.context.rec_id > 0 )
								paymentParamsMap["recordid"] = recordInfo.config.context.rec_id;							
							paymentParamsMap["refid"] = upperform.getField("refid").getValue();
							paymentParamsMap["pid"] = recordInfo.config.context.pid;
							U.call("/bp/mod/bp/record/getMultiplePaymentMsg",paymentParamsMap,function(response){
								if(response.msg != undefined && response.msg.length > 0){
									self.paymentmsgbtn(true);
									self.paymentalertmsg(response.msg);
								} else {
									self.paymentmsgbtn(false);
									self.paymentalertmsg("");
								}
							});
						
							
							
						}
						if(PPP.data.currencyMap) {
							var currencyidobj = upperform.getField("currencyid");
							var id = 0;
							if(currencyidobj){
								id = upperform.getField("currencyid").getValue();
							}

							var selectedCurrency = PPP.data.currencyMap[id];
							if(id === 0){
								id = recordInfo.config.context.p_currencyid;
								selectedCurrency = PPP.data.currencyMap[id];
								if(currencyidobj){
									upperform.updateValue("currencyid", id, selectedCurrency.currencyname);
								}
							}
							if(recordInfo.config.context.showcurrencysymbol){
								self.selectedCurrencySymbol(selectedCurrency.currencysymbol);
								self.transactionCurrencySymbol(selectedCurrency.currencysymbol);
							}
							recordInfo.config.context.t_currencysymbol=selectedCurrency.currencysymbol;
							recordInfo.config.context.t_currencyid=selectedCurrency.id;
							recordInfo.config.context.t_currencycode=selectedCurrency.currencycode;
							self.updateCurrencyDE(upperform);
						}
					}
				});
			}




			if(upperform.getField("currencyid")) {
				upperform.getField("currencyid").getControl().on({
					'valueChanged': function () {
						if(PPP.data.currencyMap){
							var id = upperform.getField("currencyid").getValue();
							var selectedCurrency = PPP.data.currencyMap[id];
							if(recordInfo.config.context.showcurrencysymbol){
								self.selectedCurrencySymbol(selectedCurrency.currencysymbol);
								self.transactionCurrencySymbol(selectedCurrency.currencysymbol);
							}
							recordInfo.config.context.t_currencysymbol=selectedCurrency.currencysymbol;
							recordInfo.config.context.t_currencyid=selectedCurrency.id;
							recordInfo.config.context.t_currencycode=selectedCurrency.currencycode;
							if(recordInfo.config.context.t_currencyid==recordInfo.config.context.p_currencyid)
							self.disableProjCostRateField(true);
							else
							self.disableProjCostRateField(false);
							if(recordInfo.config.context.t_currencyid==recordInfo.config.context.b_currencyid)
							self.disableBaseCostRateField(true);
							else
							self.disableBaseCostRateField(false);
							self.updateCurrencyDE(upperform);
						}
					}
				});
			}
		}

		if(recordInfo.config.context.rec_id > 0 && self.spec.studio.source == "cost"){
			self.showViewCurrency(true);
			self.getBaseCurrencyDetails();
			self.transactionCurrencySymbol(recordInfo.config.context.t_currencysymbol);
			if(PPP.data.upper.xid!=undefined && PPP.data.upper.xid>0)
				self.disableCurrencyPicker();
		}
		if(recordInfo.config.context.rec_id > 0 && self.spec.studio.source == "/manager/record"){
			self.disableCMxFields();
		}
		var studioType = self.spec.studio.type;
		if(self.spec.studio.source === 'cost' &&
		    (studioType === 'change_commit' || studioType === 'spend' || studioType === 'payment')){
			if(studioType === 'payment'){
				recordInfo.config.context.checkcreatesovsnapshot = false;
				if(PPP.multiplepaymentalertmsg != undefined && PPP.multiplepaymentalertmsg.length > 0){
					self.paymentmsgbtn(true);
					self.paymentalertmsg(PPP.multiplepaymentalertmsg);
				} else {
					self.paymentmsgbtn(false);
					self.paymentalertmsg("");
				}
			}
			var refpicker = upperform.getField("refid");
			if(recordInfo.config.context.standardlineexist)
				upperform.extend().detailstdlineexists = recordInfo.config.context.standardlineexist;
			else{
				if(!recordInfo.config.context.readonly && PPP.data.upper.status != "Terminated"){	
					if(refpicker){
						if (!self.no_workflow && !recordInfo.config.context.currentSteptype == "END")
							refpicker.setDisabled(false);
						if(!(typeof(self.spec.studio.terminal_status[PPP.data.upper.status]) != 'undefined'))
							refpicker.setDisabled(false);
					}                        
				}	
			}
            self.disableCurrencyPicker();
            if(PPP.data.upper.xid != undefined && PPP.data.upper.xid > 0){                    
                if(refpicker)
                    refpicker.setDisabled(true);                    
            }
		}
        if(recordInfo.config.context.rec_id > 0 && self.spec.studio.source == "rfb"){
            if(recordInfo.config.context.initialize_bid == "1") {
                if(PPP.config.public_bidding == "1"){
                    var title = PPP.data.upper.title;
                    if(title) {
                        title = _.escape(title);
                        U.AlertByKey("public_bidding_begins",title,PPP.master_vendor_bp_name);
                    } else {
                        U.AlertByKey("open_public_begins",PPP.master_vendor_bp_name);
                    }
                } else {
                    self.openBids(1);
                }
            }
        }

    	if(self.no_workflow && self.isNotifyUsersEnabled()) {
			// Pass triggerFrom flag to usergroup picker
			notifyAdditional = document.getElementById("notifyAdditional");
			oj.Context.getContext(notifyAdditional).getBusyContext().whenReady().then(function(){
				
				var resource = self.getResource() || {};
				resource.triggerFrom = "additionalNotification";
				resource.hyperlinkon = "additionalNotification";
				resource.bp_prefix = recordInfo.config.context.prefix;
				resource.bp_rec_id = recordInfo.config.context.rec_id;
				notifyAdditional.getField("notify_additional_users_groups").extend().setResource(resource);

				if(recordInfo.config.context.readonly){
					notifyAdditional.getField("notify_additional_users_groups").setProperty("disabled",true);
				}else{
					notifyAdditional.getField("notify_additional_users_groups").setDisabled(false);
				}

				notifyAdditional.addEventListener("user-group-change", function(event) {
					//console.log("Inside user-group-change .... ");
					//console.log(event);
				
					var userGroups = notifyAdditional.getValue("notify_additional_users_groups");

					triggerFrom = "additionalNotification";
					self.requireSilentSave().then(function(response){
						self.resolveUsersAndGroups(userGroups);
					}).catch(function(response){
						console.log("silent save error for notify addl users: "+JSON.stringify(response.errors));
						notifyAdditional.setValue("notify_additional_users_groups", {"users" : [], "groups" : []});
					})
					//}else{
					//	$('#notify_user_ids').ojInputText("option","value", "");
					//	$('#notify_group_ids').ojInputText("option","value", "");
					//}
				});
			});
		}
		//self.transferUserPickerSelection();

		var loadRecordComponent = function(toContent) {
			return new Promise(function(resolve, reject) {
				var comp = $(".unifier-record-component", toContent)[0];
				if (comp) {
					resolve(comp);
					return;
				}
				var cname = toContent.attr('name');
				if (cname.startsWith('unifier-record')) {
					var ud = $("." + cname)[0];
					U.loadDefer("." + cname).then(function() {
						toContent.append($(".unifier-record-component", ud));
						setTimeout(function() {
							U.Event.publish('record-tabs-resize', {height: $(window).height(), width: $(window).width()});
							resolve($(".unifier-record-component", toContent)[0]);
						}, 0);
					});
				}
				else
					reject();
			});
		}

		var selectRecordComponent = function(tag) {
			loadRecordComponent($("#tabUpper-tabs div[name="+tag+"]")).then(function(component){
				self.recordRightTab = component;
				if (component)
					component.select(recordInfo);
			})
		}

		$("#tabUpper-tabs").ojTabs({
			"select": function( event, ui ) {
				loadRecordComponent(ui.toContent).then(function(component){
					self.recordRightTab = component;
					
					if(!self.hideSpaceContent() && "unifier-record-refRecord"==ui.toTab.attr("id")){
						var id = ko.dataFor(document.getElementById("refRecordModule"));
						id.calledFromSpace(PPP.data.upper.space_common_id);
					}
					if (component)
						component.select(recordInfo);
				})
			},
			"beforeDeselect": function( event, ui ) {
				return recordInfo.unchanged;
			}
		});

		//Creating a record from DM
	    if(PPP.fromDm === "1") {
	        if(PPP.uuu_dm_nodes !== "") {
	            if(!self.spec.form.params || !self.spec.form.params.attach_all || !self.spec.form.params.attach_uf) {
	                U.AlertByKey("no_dm_files_allowed");
	                return;
	            }

	            var saveRec = false;
	            if(recordInfo.config.context.no_workflow)
	                saveRec = recordInfo.config.context.rec_id == 0;
	            else
	                saveRec = recordInfo.config.context.task_id == 0;

	            if(saveRec) {
	                self.silentSave().then(function(response){
	                    if(response.errors.length > 0) {
	                       return;
	                    }else {
	                    	var record_id = 0;
	                        if(!recordInfo.config.context.no_workflow) {
	                            var parent_id = recordInfo.config.context.task_id;
	                        } else {
	                            var parent_id = recordInfo.config.context.rec_id;
	                            record_id = response.upper.id;
	                        }
	                        
	                        if(PPP.spec.studio.source == "document" && self.spec.studio.subtype == "wofs"){
	                        	console.log(self.spec);
	                        	console.log(PPP);
	                        	var params = {};
	                        	var  url = "/bp/studio/bp/document/launch_doc_bp_from_dm"

	                        	params.subtype = PPP.spec.studio.subtype;
		                        params.record_id = record_id;

	           					if(!recordInfo.config.context.no_workflow){
	           						params.task_clause = 1;
	           						params.task_id = response.draft.taskId; 
                            		params.process_id = response.process_id;
	           					}

	           					params.model = PPP.spec.upper.prefix;
	           					params.create_dm_linknode = 1;
	           					//params.record_no = "";
	           					params.project_id =  PPP.data.upper.project_id;
	           					params.group_id = 0;
	           					params.phase = PPP.phase;
			                    params.fromOjet = true;
			                    params.ids = PPP.uuu_dm_nodes;
			                    params.uuu_dm_nodes = PPP.uuu_dm_nodes;

			                    if(PPP.spec.studio.subtype == "wfs"){
			                    	params.isAdvdoc = "true";
			                    }

		                        U.call(url, params, function(response) {
		                            if(response.duplicate_files_ignored && response.duplicate_files_ignored === "1") {
		                                U.AlertByKey("ignore_duplicate_files");
		                                return;
		                            }
		                        });
	                        }else if(PPP.spec.studio.source == "document" && self.spec.studio.subtype == "wfs"){
	                        	return;
	                        }else{
	                        	var  url = "/bp/studio/share/launch_bp_from_dm"
	                        	var params = {
		                            phase : PPP.phase,
		                            parent_type : 'task',
		                            parent_id : parent_id,
		                            uuu_dm_nodes : PPP.uuu_dm_nodes,
		                            ids : PPP.uuu_dm_nodes,
		                            fromOjet : true
		                        }

		                        U.call(url, params, function(response) {
		                            if(response.duplicate_files_ignored && response.duplicate_files_ignored === "1") {
		                                U.AlertByKey("ignore_duplicate_files");
		                                return;
		                            } else {
		                            	selectRecordComponent("unifier-record-attachment");
		                            }
		                        });
	                        }    
	                    }
	                });
	            }
	        }
	    }

	 
      self.contextReady = true;

	  selectRecordComponent( $("#tabUpper-tabs").ojTabs("option","selected") );
	  if((PPP.sovdraftmergemsg != undefined && PPP.sovdraftmergemsg.length > 0)
			  || (PPP.paymentmergemsg != undefined && PPP.paymentmergemsg.length > 0)){
		  U.AlertByKey("psov_merge_notify_msg");
	  }
  })

	self.getBaseCurrencyDetails = function(){
		var baseCurrencyName = recordInfo.config.context.b_currencyname;
		self.baseCurrecySymbol(recordInfo.config.context.b_currencysymbol);
		var bCurrency = {value: "2", label: U.translate(baseCurrencyName)};
		self.currencyOptions.push(bCurrency);
	};

    self.resolveUsersAndGroups = function(userGroups) {
    	// console.log("Inside resolveUsersAndGroups");

		var groupsArray = userGroups.groups ? userGroups.groups : [];
    	var usersArray = userGroups.users ? userGroups.users : [];

    	var groupsList = _.pluck(groupsArray,"id").join(",");
    	var usersList = _.pluck(usersArray,"id").join(",");

    	var usersdata = {"users" : usersArray, "groups" : groupsArray};

    	$('#notify_user_ids').ojInputText("option","value", usersList);
    	$('#notify_group_ids').ojInputText("option","value", groupsList);

    	notifyAdditional.setValue("notify_additional_users_groups", usersdata);
    	self.insertUserGroup(recordInfo.config.context.rec_id);
    };

    self.insertUserGroup = function(record_no) {
    	// console.log("Inside insertUserGroup");
    	var usersList = $('#notify_user_ids').ojInputText("option","value");
		var groupsList = $('#notify_group_ids').ojInputText("option","value");

		if(usersList.length == 0 && groupsList.length == 0)
			return;

    	var payload = {};
    	payload.userids = usersList;
    	payload.groupids = groupsList;
    	payload.prefix = recordInfo.config.context.prefix;
    	payload.recordid = record_no;

		U.rest('POST', '/bp/mod/bp/record/insertUserGroup', payload,
			function(response) {
				U.CloseShowWaiting();

				if(typeof(response.error) != "undefined" && response.error.length > 0){
					//console.log("Error in saving User Groups::" +JSON.stringify(response.error));
				} else {
					//console.log("User Groups saved");
				}
			},
			function(err, status) {
				U.Alert("Error1:"+err.message+" Status:"+status);
			}
		)
	};


	self.loadConfiguration = function(config) {
		// console.log("Inside loadConfiguration");
		self.isNotifyUsersEnabled(config.context.isNotifyUsersEnabled);
		document.title=config.context.windowTitle;
		self.payload.context = config.context;
		self.toolButtons(config.buttons);
		self.menuActions(config.actions);
		self.context(config.context);
		if(config.context.iscompanyBp){
		    self.showLinkedMail(false);
        } else {
            self.showLinkedMail(true);
        }

		var tab_aud = false;
		var tab_ref = false;
		var tab_spcon = false;
		for(var i=0; i< config.Tabs.length;i++ ){
			//alert(config.Tabs[i].key)
			if(config.Tabs[i].key == "auditlog")
				tab_aud = true;

			if(config.Tabs[i].key == "referecords")
				tab_ref = true;
			
			if(config.Tabs[i].key == "spacecontent")
				tab_spcon = true;
		}
		self.hideAuditLog(!tab_aud);
		self.hideReferenceRecords(!tab_ref);
		self.hideSpaceContent(!tab_spcon);
		//alert(!tab_aud)
		self.formTitle(config.context.formTitle);


		self.upkHelpApp(config.upkHelpApp);
		self.sessionBeanId(config.sessionBeanId);

		if(config.context.formid === "form.bid.0" || PPP.vendorId == 0 )
            self.bpHelpStr(config.context.bpName + ' ' +U.translate("Help"));
         if(PPP.vendorId == 0)
            self.upkHelpURL(config.upkHelpURL);
		window.iasNamespace = config.upkHelpApp;
		window.iasContentUrl = config.upkHelpURL;
  		upperform.loadConfig(config.definitions,config.upper);

		if (config.context.readonly)
			upperform.extend().disableAll();

		for(var st=0; st< config.buttons.length;st++ ){
			if(config.buttons[st].label === "Submit") {
                if(config.context.formid === "form.bid.0")
                    self.btnBidSubmit(true);
                else
                    self.btnSubmit(true);
            }
			else if(config.buttons[st].label === "Edit")
				self.btnEdit(true);
			else if(config.buttons[st].label === "Workflow")
				self.btnViewWF(true);
			else if(config.buttons[st].label === "Send")
				self.btnSend(true);
			else if(config.buttons[st].label === "Complete")
				self.btnComplete(true);
			else if(config.buttons[st].label === "Save")
				self.btnSave(true);
			else if(config.buttons[st].label === "Accept Task")
				self.btnAccept(true);
			else if(config.buttons[st].label === "Decline Task")
				self.btnDecline(true);
			else if(config.buttons[st].label === "Review")
				self.btnReview(true);
			else if(config.buttons[st].label === "Close")
				self.btnClose(true);
            else if(config.buttons[st].label === "Save Draft")
                self.btnBidDraft(true);
  		}
		upperform.extend().setHolidaysObj(config.context.holidayweeklyoff,config.context.holidaylist,config.context.userPrefOffsethrs);
		// console.log("menu ====> " + JSON.stringify(self.wfMenu()) + " : " + self.showIstepWfMenu());
		$("#tabUpper-tabs").ojTabs("refresh");
	}

	self.loadWFConfig = function(config) {
		if(self.no_workflow || config.context.rec_id == 0) {
			self.hideWorkflowProgress(true);
		}else if(PPP.data.workflow) {
			self.hideWorkflowProgress(PPP.data.workflow.permission_hidetaskstatuses);
		}

		if(PPP.data.workflow) {				
			// edit_duedate will be set to true only if record id = 0 and override is set to yes in workflow setup
			var editDueDate = PPP.data.workflow.edit_duedate;
			var field = upperform.getField("due_date");			
			if (field) {				
				if(!field.disabled) {
					if(!editDueDate) {
						field.setDisabled(true);
					} else if(!field.required) {
						recordInfo.upperform.extend().isDueDateRequired = true;
					}
				}
			}
		}

		if(!self.no_workflow)
			self.getWorkflowTemplateMenu();
	}

	self.getWorkflowTemplateMenu = function() {
		var wf = PPP.data.workflow;

		if(!self.no_workflow && wf != null && wf.istep === true) {
			if(wf.actions.length == 0) {
				//U.AlertByKey("no_assigned_template_alert");
				//return;
			}
			if(!self.btnAccept()) return;
			// console.log("wf.actions ====> " + JSON.stringify(wf.actions));
			if(wf.actions.length > 1) {
				var wfMenu = [];
				_.each(wf.actions, function(a) {
					var menu = {label: a.label, value : a.value, action: function(){ self.acceptIStepWF(this); }}
					wfMenu.push(menu);
				});

				self.wfMenu(wfMenu);
				self.showIstepWfMenu(true);
			}
		}
	};

	self.acceptIStepWF = function(action) {
		// console.log("WF Action : " + JSON.stringify(action));
		var wf = PPP.data.workflow;
		var context = recordInfo.config.context;
		var  url = "/bp/studio/workflow/initiate_bp/accept/istep";
		var params = {
						source : self.spec.studio.source,
						model : context.prefix,
						initiateBP : "yes",
						task_id : wf.task_id,
						id : context.rec_id,
						wftemplate_id : action.value,
						project_id : context.pid
		}
		// console.log("params ====> " + JSON.stringify(params));
		U.ShowWaiting();
		U.call(url, params, function(response) {
				// console.log("response: " + JSON.stringify(response));
				U.CloseShowWaiting();
				if(response.error) {
					U.Alert(response.message);
					return;
				}
				window.opener.submit_search();
				U.replaceLocation("/bp/mod/bp/record/opentask/" + wf.task_id);
				$("#record-container").html(U.getProcessingDotsHTML());
		 });
	}
	
	self.addComment = function(){
		var data = window.opener.getFileData();
		
		var postData = {
              source: 'BP',
              file_id: data.file_id,
              task_id: recordInfo.config.context.task_id,
              comment: data.comment,
              annotations: data.annotation,
              page_num: 1,
              attachment_count: 0,
              comment_state: 0,
              comment_status: 0
        };
		console.log('add Comment -- '+JSON.stringify(postData));
		recordInfo.postData = postData;
	};
	
	self.reloadData = function() {
		console.log("reloadData " + JSON.stringify(PPP.data));
		//console.log("current:"+JSON.stringify(upperform.extend().getCurrentData()));
		var data = window.opener.getFileData();

		console.log('reload data :'+JSON.stringify(data));
		//PPP.data.upper.usrSRTitle = data.usrSRTitle;
		//PPP.data.upper.usrSRSubCatPD = data.usrSRSubCatPD;
		//PPP.data.upper.usrAddAssetDetailsTB500 = data.usrAddAssetDetailsTB500;
		//PPP.data.upper.upmEqpTypePD = data.upmEqpTypePD;
		//PPP.data.upper.upmEqpName = data.upmEqpName;
		//PPP.data.upper.NCR_IssueDesc_Eng_txt = data.NCR_IssueDesc_Eng_txt;
		//PPP.data.upper.usrServiceCategoryPD = data.usrServiceCategoryPD;

		
		/*
		PPP.data.upper.usrSRother = data.usrSRother;
		PPP.data.upper.usrEquipmentDP = data.usrEquipmentDP;
		
		PPP.data.upper.uworEmergencyPD = data.uworEmergencyPD;
		PPP.data.upper.uuu_user_firstname = data.uuu_user_firstname;
		PPP.data.upper.uuu_user_lastname = data.uuu_user_lastname;
		
		PPP.data.upper.uRequesterDP = data.uRequesterDP;
		*/
		postPopData = {};
		if(data.BP == 'Service Req'){
			postPopData.usrSRTitle = data.usrSRTitle;
			postPopData.usrSRSubCatPD = data.usrSRSubCatPD;
			postPopData.upmEqpTypePD = data.upmEqpTypePD;
			postPopData.upmEqpName = data.upmEqpName;
			postPopData.NCR_IssueDesc_Eng_txt = data.NCR_IssueDesc_Eng_txt;
			postPopData.usrServiceCategoryPD = data.usrServiceCategoryPD;
		}else if(data.BP == 'Procurement'){
			postPopData.title = data.title;
			postPopData.Product = data.Product;
			postPopData.description = data.description;
			postPopData.amount = data.amount;
		}
		upperform.loadValues(PPP.data.upper);
		setTimeout(function() {upperform.updateValues(postPopData);}, 100);
		
		console.log('upper form values :'+JSON.stringify(upperform.getValues()));
		//----------------------- end of 
		if(PPP.fromFMRECopy === "true"){
			upperform.extend().updatedValues = $.extend(true, {}, PPP.data.upper);
		}
		//when form is ready update values for each qbde
		if(PPP.modifiedQueryDes){
            for(var k in PPP.modifiedQueryDes) {
                console.log("updating query de field "+ k + " == "+ PPP.modifiedQueryDes[k]);
                upperform.extend().updatedValues[k] = PPP.modifiedQueryDes[k];
            }
        }
        
		if (PPP.data.draft) {
			//console.log("loadDraft " + JSON.stringify(PPP.data.draft));
			upperform.extend().updatedValues = PPP.data.draft.upper;
			self.tempSnapShot = upperform.extend().getUpdatedData();
		}

		if(self.isNotifyUsersEnabled() && self.no_workflow && recordInfo.config.context.rec_id > 0) {
			self.setUsersAndGroups();
		}

		console.log("Inside Reloaddata updateCurrencyDE");
		if((self.spec.studio.source == "cost" || (PPP.config.context.iscompanyBp && PPP.spec.studio.subtype == "bpo")) && recordInfo.config.context.showcurrencysymbol){
			if(recordInfo.config.context.t_currencysymbol && recordInfo.config.context.showcurrencysymbol){
				self.transactionCurrencySymbol(recordInfo.config.context.t_currencysymbol);
			}
			self.updateCurrencyDE(upperform);
		}

	}

	self.updateCurrencyDE = function(upperform){
		if(!recordInfo.config.context.showcurrencysymbol)
			return;
		//console.log(upperform.getFields());
		if(self.spec.studio.source == "cost" || (PPP.config.context.iscompanyBp && PPP.spec.studio.subtype == "bpo")){
			_.each(upperform.getFields(), function(field){
				if(field && field.design && field.design.type) {
					if(field.design.type == "currency") {
						var fld = upperform.getField(field.design.name);
						if (!fld) {
							return;
						}
						fld.extend().setConverter("currency", self.transactionCurrencySymbol(), 2);
					}
				}
			});
		}


	};
	self.setUsersAndGroups = function(){
		// console.log("Inside setUsersAndGroups");
		// console.log(PPP.userGroups);
		var usersGroupsList = [];
		var users = [];
		var groups = [];
		for(var i = 0; i < PPP.userGroups.length; i++){
			var data = PPP.userGroups[i];

			for(var j = 0; j < data.length; j++){
				var groupid = data[j].groupid;

				if(groupid == 0){
					usersGroupsList.push(data[j].firstname + " " + data[j].lastname);
					data[j].id = data[j].userid;
					users.push(data[j]);
				}else{
					usersGroupsList.push(data[j].groupname);
					data[j].id = data[j].groupid;
					groups.push(data[j]);
				}
			}
		}

		var finalList = usersGroupsList.join();
		// console.log(finalList);
		var userdata = {"users" : users, "groups" : groups};
		notifyAdditional.setValue("notify_additional_users_groups", userdata);
		notifyAdditional.getField("notify_additional_users_groups").setProperty("display" ,finalList);
	};

	var loadWorkflowGridData = function() {

		var toVal = actionDetail.getValue("to");
		// console.log("The to List ====> " + JSON.stringify(toVal));

		var item = [];
		if (toVal && toVal.users) {
			_.each(toVal.users, function(r) {
				var obj = {};
				obj.key = r.id;
				obj.name = r.name;
				obj.company_name = r.companyname;
				obj.task_due_date = oj.IntlConverterUtils.dateToLocalIso(new Date(defaultTaskDueDate));
				item.push(obj);
			});
		}
		if (toVal && toVal.groups) {
			_.each(toVal.groups, function(r) {
				var obj = {};
				obj.key = r.id;
				obj.name = r.name;
				obj.company_name = r.companyname;
				obj.task_due_date = oj.IntlConverterUtils.dateToLocalIso(new Date(defaultTaskDueDate));
				item.push(obj);
			});
		}
		self.gridData = item;
		columns[2].readOnly = $("input:radio[name=radio_task_due_date]:checked").val() == 1 ? false : true;
		loadWorkflowGrid();
	}

	var loadActionDetail = function() {

		if((self.isTemplate && self.templateStatus == "Complete") || recordInfo.config.context.bpSendComplete) {
			loadViewWorkflow();
			$("#wfSend").ojButton("option", "disabled", false);
			return;
		}

		var wf = PPP.data.workflow;
		actionDetail = document.getElementById("actionDetail");
		actionDetail.getField("action").setDisabled(false);
		actionDetail.getField("action").setOptions(wf.actions);
		actionDetail.setValue("step",null);
		actionDetail.setValue("to",null);
		actionDetail.getField("to").setProperty("display",[]);
		actionDetail.setValue("cc",null);
		actionDetail.getField("cc").setProperty("display",[]);
		actionDetail.getField("to").setDisabled(true);
		actionDetail.getField("cc").setDisabled(true);
		self.showTaskDueDate(false);
		self.showTaskInfo(false);
		self.showDueDate(false);
		actionDetail.setValue("task_due_date", null);
		self.showCC(false);
		self.showTo(false);
		if(self.isTemplate) {
			self.showTo(true);
			if(self.templateStatus == "Complete")
				self.showSendButton(false);
			else
				self.showSendButton(true);
		} else{
			self.showSendButton(true);
		}

		actionDetail.getField("to").addEventListener("displayChanged", function(event) {
			loadWorkflowGridData();
		});

		$("#radio_date_user").on("click", function(){
			loadWorkflowGridData();
		});

		$("#radio_date_all").on("click", function(){
			columns[2].readOnly = true;
			var ugrid = $("#duedate-grid")[0].extend();
			ugrid.defineColumns(columns);
			ugrid.renderGrid();

		});

		if(wf.actions.length == 1) {
			pickedLinkId = wf.actions[0].value;
			actionDetail.getField("action").setValue(pickedLinkId);
			loadWorkflowDetail().then(function(response){
				if(response.error_code == 1) {
					U.AlertByKey("studio_workflow_no_task_data");
				}
				else {
					var $widget = $("#actionDetailDialog").ojDialog("widget");
					$widget.css({"top":(Math.round($(window).height() - $widget.height())/2) + "px"});
					$("#wfSend").ojButton("option", "disabled", false);
				}
			});
		} else{
			//var $widget = $("#actionDetailDialog").ojDialog("widget");
			//$widget.css({"top":(Math.round($(window).height() - $widget.height())/2) + "px"});
		}

		actionDetail.getField("action").getControl().on({"valueChanged": function(event) {

			if (event.detail.updatedFrom === "internal") {
				// console.log("Action ID: " + event.detail.value);				
				pickedLinkId = actionDetail.getField("action").getValue();
				loadWorkflowDetail().then(function(response){
					if(response.error_code == 1) {
						U.AlertByKey("studio_workflow_no_task_data");
					}
					else {
						var $widget = $("#actionDetailDialog").ojDialog("widget");
						$widget.css({"top":(Math.round($(window).height() - $widget.height())/2) + "px"});
						$("#wfSend").ojButton("option", "disabled", false);
					}
				});
			}
		}});
	}

	var loadWorkflowDetail = function() {
		var wf = PPP.data.workflow;

		var data = upperform.getValues();
		var info = {
			model : wf.model,
			wfdesign : wf.wfdesign,
			process_id : wf.process_id,
			link_id : pickedLinkId,
			wftemplate_id : wf.wftemplate_id
		};

		var payload = { upper: data, workflow : info};
		// console.log("payload ====> " + JSON.stringify(payload));

		//Reset the fields
		actionDetail.setValue("to",null);
		actionDetail.getField("to").setProperty("display",[]);
		actionDetail.setValue("cc",null);
		actionDetail.getField("cc").setProperty("display",[]);
		actionDetail.setValue("task_due_date", null);
		clickSStep = false;
		autoCreateList = [];

		return new Promise(function(resolve, reject) {
		U.rest('POST', '/bp/mod/bp/record/wf/action', payload, function(response) {
				if(response.error_code === 1){
					resolve(response);
				}else {
					selectedWF = response.workflow;
					// console.log("wf ====> " + JSON.stringify(selectedWF));
					nextStep = selectedWF.nextStep;
					actionDetail.setValue("step",nextStep.name);
					defaultTaskDueDate = nextStep.defaultTaskDueDate;
					//defaultTaskDueDate = null;
					if(self.isTemplate) {
						if(nextStep.type === 3)
							self.showTo(false);
						else
							self.showTo(true);
						self.showDueDate(false);
						self.showTaskInfo(false);
						self.showTaskDueDate(false);
					} else if(nextStep.type === 3) {
						self.showDueDate(false);
						self.showTaskInfo(false);
						self.showTaskDueDate(false);
						self.showTo(false);
					} else {
						self.showTo(true);
						self.showDueDate(true);
						if(defaultTaskDueDate) {
							self.showTaskInfo(false);
							actionDetail.setValue("task_due_date", U.DateTimeConverter.format(oj.IntlConverterUtils.dateToLocalIso(new Date(defaultTaskDueDate))));
							if(nextStep.editTaskDueDate) {
								self.showTaskDueDate(true);
								loadWorkflowGrid();
								$('#due_date_all').ojInputDateTime("option","value", oj.IntlConverterUtils.dateToLocalIso(new Date(defaultTaskDueDate)));
							} else{
								self.showTaskDueDate(false);
							}
						} else{
							self.showTaskDueDate(false);
							self.showTaskInfo(true);
						}
					}

					if (nextStep.adhoc)
					{
						actionDetail.getField("to").setDisabled(false);
						actionDetail.getField("to").setResource(selectedWF.to);
						var toResource = actionDetail.getField("to").getResource();
						toResource.sourceId = nextStep.toSourceId;
						toResource.assigneeFilter = nextStep.assigneeFilter;						
						toResource.isMatchStep = nextStep.isMatchStep;
						toResource.role = 1;
						
					}
					else // pre-assigned TO
					{
						actionDetail.getField("to").setDisabled(true);
						actionDetail.setValue("to", selectedWF.to);
						actionDetail.getField("to").setResource(selectedWF.to);
						var toResource = actionDetail.getField("to").getResource();
						toResource.hyperlinkon = "wfdialog";
						toResource.to_cc = "to";
						toResource.source_id = nextStep.toSourceId;
						toResource.assigneeFilter = nextStep.assigneeFilter;		
						toResource.isMatchStep = nextStep.isMatchStep;
					}					

					if((selectedWF.cc.users && selectedWF.cc.users.length > 0) || (selectedWF.cc.groups && selectedWF.cc.groups.length > 0))
					{
						if(nextStep.cc_ok === 1 || nextStep.cc_ok === 2 || (nextStep.cc_ok === 3 && nextStep.add_cc_ok)) {
							self.showCC(true);
							if (nextStep.cc_ok === 1) // allow CC
							{
								if (nextStep.add_cc_ok) {
									if (selectedWF.add_cc && selectedWF.add_cc.users) {
										_.each(selectedWF.add_cc.users, function(r) {
											selectedWF.cc.users.push(r);
										});
									}
									if (selectedWF.add_cc && selectedWF.add_cc.groups) {
										_.each(selectedWF.add_cc.groups, function(r) {
											selectedWF.cc.groups.push(r);
										});
									}
								}
								actionDetail.getField("cc").setDisabled(false);
								actionDetail.getField("cc").setResource(selectedWF.cc);
								var ccResource = actionDetail.getField("cc").getResource();
								ccResource.sourceId = nextStep.ccSourceId;								
								ccResource.ccFilter = nextStep.ccFilter;
								ccResource.role = 2;
								if (nextStep.add_cc_ok) {								
									ccResource.role = 220;
								}								
							}
							else if (nextStep.cc_ok === 2) // pre-assigned CC
							{
								actionDetail.getField("cc").setDisabled(true);
								actionDetail.setValue("cc", selectedWF.cc);
								actionDetail.getField("cc").setResource(selectedWF.cc);
								var ccResource = actionDetail.getField("cc").getResource();
								ccResource.hyperlinkon = "wfdialog";
								ccResource.to_cc = "cc";
								ccResource.source_id = nextStep.ccSourceId;
								ccResource.ccFilter = nextStep.ccFilter;
							}
							else if (nextStep.cc_ok === 3 && nextStep.add_cc_ok) // pre-assigned CC and allow add CC
							{
								actionDetail.getField("cc").setDisabled(false);								
								var preCC = JSON.parse(JSON.stringify(selectedWF.cc));										
								actionDetail.setValue("cc", preCC);	
								
								if (selectedWF.add_cc && selectedWF.add_cc.users) {
									_.each(selectedWF.add_cc.users, function(r) {
										selectedWF.cc.users.push(r);
									});
								}
								if (selectedWF.add_cc && selectedWF.add_cc.groups) {
									_.each(selectedWF.add_cc.groups, function(r) {
										selectedWF.cc.groups.push(r);
									});
								}								
								actionDetail.getField("cc").setResource(selectedWF.cc);								
								var ccResource = actionDetail.getField("cc").getResource();
								ccResource.sourceId = nextStep.ccSourceId;
								ccResource.ccFilter = nextStep.ccFilter;
								ccResource.role = 220;								
							}
						} else{
							self.showCC(false);
						}
					} else{
						self.showCC(false);
					}

					resolve(response);
				}
			});
		});
    }

	var loadWorkflowGrid = function() {

		var ugrid = $("#duedate-grid")[0].extend();
		ugrid.defineRecordKeys({numericalId:true});
		ugrid.defineDefaultColumn({width: 180});
		ugrid.defineMenuActions([]);

		//ugrid.json.editable(true);
		//ugrid.json.contextMenu().enabled = false;
		ugrid.setOption('contextMenu', {'enabled' : false});
		ugrid.defineColumns(columns);
		ugrid.showQuickFilter = false;
		ugrid.renderGrid();
		ugrid.initSize();
		ugrid.loadData(self.gridData);

		if(self.gridData.length > 0) {
			ugrid.gridSelectCell(self.gridData[0].key,0,0);
		}

		var notifyResize = _.debounce(function() {
			var h = $(window).height();
			$("#duedate-grid-container").height("120px");
			ugrid.initSize();
		},200);

		notifyResize();
	}

	var loadSStepGrid = function(bpList) {

		var cols = [
			{name: 'name', label: U.translate('Business Process'), readOnly: true}
		]

		var items = [];
		_.each(bpList, function(r) {
			var obj = {};
			obj.key = r.name;
			obj.name = r.name;
			items.push(obj);
		});

		var ugrid = $("#sstep-grid")[0].extend();
		ugrid.defineRecordKeys({numericalId:false});
		ugrid.defineDefaultColumn({width: 320});
		ugrid.defineMenuActions([]);

		//ugrid.json.contextMenu().enabled = false;
		ugrid.setOption('contextMenu', {'enabled' : false});

		ugrid.defineColumns(cols);
		ugrid.showQuickFilter = false;
		ugrid.renderGrid();
		ugrid.initSize();
		ugrid.loadData(items);
		self.autoCreateCount(items.length);

		var notifyGridResize = _.debounce(function() {
			$("#sstep-grid-container").height("230px");
			ugrid.initSize();
		},200);

		oj.Context.getContext(document.getElementById("autoCreateSStep")).getBusyContext().whenReady().then(function(){
			notifyGridResize();
			$("#sstepSend").focus();
		});
	}

	var loadTaskDetail = function() {
		var wf = PPP.data.workflow;
		if(wf.istep === true) {
			taskDetail.setValue("step", U.translate("Initiation"));
			return;
		}
		taskDetail.setValue("from", wf.from);
		taskDetail.setValue("to", wf.to);
		taskDetail.setValue("cc", wf.cc);
		var fromResource = taskDetail.getField("from").getResource();
		fromResource.userid = wf.from.users[0].key;
		fromResource.hyperlinkon = "singleUser";
		taskDetail.getField("from").setResource(fromResource);
		
		taskDetail.getField("to").setResource(wf.to);
		taskDetail.getField("cc").setResource(wf.cc);
		
		var toResource = taskDetail.getField("to").getResource();
		toResource.hyperlinkon = "viewform";
		toResource.to_cc = "to";
		toResource.process_id = wf.process_id;
		toResource.step_id = wf.currentStep.id;
		toResource.assigneeFilter = wf.currentStep.assigneeFilter;
		
		var ccResource = taskDetail.getField("cc").getResource();
		ccResource.hyperlinkon = "viewform";
		ccResource.to_cc = "cc";
		ccResource.process_id = wf.process_id;
		ccResource.step_id = wf.currentStep.id;
		ccResource.ccFilter = wf.currentStep.ccFilter;
																		
		taskDetail.setValue("step", wf.currentStep.name);
		if(wf.currentStep.task_due_date == "") {
			self.showDueDate(false);
		} else{
			self.showDueDate(true);
			taskDetail.setValue("task_due_date", wf.currentStep.task_due_date);
			if(wf.currentStep.late)
				self.showLate(true);
		}

		if(wf.cc && wf.cc.users && wf.cc.users.length == 0 && wf.cc.groups && wf.cc.groups.length == 0 ) {
			self.showCC(false);
		}
	}


    self.cancelDetailForm = function() {
        _.each(self.spec.form.bp_tab, function(tab) {
            var detail = self.detailInfo[tab.tab_id];
            if(detail.type === "detailTab" && detail.component && detail.component.extend().getForm()) {
                detail.component.extend().getForm().reload();
                detail.component.extend().cancelDetailData();
            }
        })
    }

	self.onCurrencyChanged = function (event) {
		console.log("Inside onCurrencyChanged: ");
		//console.log(event["detail"]);
		var data = self.buildValueChange(event["detail"]);
		if(data.value !== self.selectedCurrencyId()) {
			self.selectedCurrencyId(data.value);
			var detailObj = self.detailInfo[self.currentTabId];

			var context = recordInfo.config.context;
			if(self.selectedCurrencyId() == "0"){
				self.displayRate = 1.0;
				if(recordInfo.config.context.showcurrencysymbol){
					self.selectedCurrencySymbol(context.t_currencysymbol);
					self.transactionCurrencySymbol(context.t_currencysymbol);
				}
			}else if(self.selectedCurrencyId() == "1"){
				self.displayRate = context.rate;
				if(recordInfo.config.context.showcurrencysymbol){
					self.selectedCurrencySymbol(context.p_currencysymbol);
				}
			}else if(self.selectedCurrencyId() == "2"){
				self.displayRate = context.usdrate;
				if(recordInfo.config.context.showcurrencysymbol){
					self.selectedCurrencySymbol(self.baseCurrecySymbol());
				}
			}
			if(recordInfo.config.context.showcurrencysymbol)
				detailObj.params.selectedCurrencySymbol = self.selectedCurrencySymbol();
			if(!recordInfo.config.context.showcurrencysymbol){
				detailObj.params.selectedCurrencySymbol = "";
			}
			detailObj.params.displayRate = self.displayRate;
			detailObj.params.selectedViewCurrencyId = self.selectedCurrencyId();
			detailObj.ulog.invokeRefresh();
		}
	};

	self.buildValueChange = function(valueParam) {
		var valueObj = {};

		valueObj.previousValue = valueParam.previousValue;
		valueObj.value = valueParam.value;

		return valueObj;
	};
	
	self.addNewRows = function(){
		alert('inside record.js model');
	}

	self.deployButtons = function(){
		var tab = 'tab' + self.currentTabId;
		var toolbar = document.getElementById(tab + '-toolbar');
		var detailObj = self.detailInfo[self.currentTabId];
		detailObj.ulog.getViewConfig().deployButtons(toolbar, ["refresh","print-menu","search","find","expand-groups","collapse-groups"]);
		var ugrid = detailObj.ulog.getGrid();
		detailObj.ulog.getViewConfig().showGroupButtons(ugrid);
	}
	window.getAllowReserveValue = function()
	{
		if(typeof(upperform.getField("uuu_rsv_reservable"))!= "undefined" & upperform.getField("uuu_rsv_reservable").getValue() != "Y" )
			return 0 ;
		else
			return 1;
	}

	window.updateRfbDuedate = function(updateDuedate){
        if(upperform.getField("uuu_rfb_due_date"))
            upperform.setValue("uuu_rfb_due_date",oj.IntlConverterUtils.dateToLocalIso(new Date((updateDuedate))));
	}


	window.getItemUrl = function(itemid,taskid,tabId,ouiviewer)
	{
		var recModel = self;
		var source = recModel.spec.studio.source;
		var formid = recModel.forReviewRecordInfo.config.context.formid;
		var model = recModel.forReviewRecordInfo.config.context.prefix;
		var pid = recModel.forReviewRecordInfo.config.context.pid;
		var status = recModel.forReviewRecordInfo.upperform.getValues().status;
		var wfSchemaId = 0;
		if(!self.no_workflow)
			wfSchemaId = recModel.forReviewWFObj.wftemplate_id;
		var closed_process = 0;
		var taskSourceTypeId = 0;
		var reached_terminal_status = "0";
		var is_end = "false";
		if(!self.no_workflow){
			if(recModel.forReviewWFObj.istep === true)
				taskSourceTypeId = 3;
			if(recModel.forReviewRecordInfo.config.context.currentStepType == "END" || recModel.forReviewWFObj.istep == true)
				closed_process = 1;
			if(recModel.forReviewRecordInfo.config.context.processStatus == 5 || recModel.forReviewRecordInfo.config.context.processStatus == 2)
				is_end = "true";
		}
		if(typeof(recModel.forReviewRecordInfo.terminalStatus[recModel.forReviewRecordInfo.upperform.getValues().status]) != "undefined")
			reached_terminal_status = "1";
		var openAction = "/bp/studio/bp/"+source+"/itemopen?a="+formid+"&__uref=" + U.uref+"&id="+itemid+"&model="+model+"&schemaid="+wfSchemaId+"&project_id="+pid+"&tabId="+tabId+"&inReview=1&inOUIViewer=1&newUI=1&closed_process="+closed_process+"&isEnd="+is_end+"&reached_terminal_status="+reached_terminal_status+"&status="+status+"&taskSourceTypeId="+taskSourceTypeId;
		return openAction;
	}

    self.canAddCostLineItem = function() {
        if(self.spec.studio.source === 'cost') {

        	var refid = upperform.getField("refid"); 
        	var ref_bpo = upperform.getField("ref_bpo");

            if(refid) {
            	var refid_value = refid.getValue();

            	if(!refid_value || refid_value == 0){
                	U.AlertByKey("add_ref_commit");
                	$("#record-tabs").ojTabs("option","selected","tabUpper-");
                	return false;
            	}
            }
            
            if(ref_bpo) {
            	var ref_bpo_value = ref_bpo.getValue();

            	if(!ref_bpo_value || ref_bpo_value == 0){
                	U.AlertByKey("select_reference_bpo");
					$("#record-tabs").ojTabs("option","selected","tabUpper-");
                	return false;
            	}
            }
        }
        return true;
    }
	/*U.Event.subscribe('currency-changed',function(data) {
		if (data) {
			self.selectedCurrencySymbol(data.t_currencysymbol);
		}
	});*/
    
	self.handleBindingsApplied = function(info) {
		// console.log("Inside handleBindingsApplied");
		self.handleBindingsAppliedLineitem(info);
    	if (PPP.vendorId === 0) {
    		self.showCustomPrint(true);
		}

		if(PPP.templatestatusupdated) {
		    window.opener.submit_search("refreshbptemplatelog");
		}

        // Bug 29444964 - Change the Tooltip display to be a popup that stays within the window.
        var alertIcon  = $("#payment-msg-btn");
        var alertPopup = $("#payment-msg-popup")[0];
        var alertFocus = function() {
            alertPopup.open(alertIcon);
        };
        var alertLeave = function() {
            alertPopup.close();
        };
        var eventNamespace = '.ojButton';
        alertIcon.on('focusin' + eventNamespace + ' mouseenter' + eventNamespace, alertFocus);
        alertIcon.on('mouseleave' + eventNamespace, alertLeave);
                             
		self.populateAssignee();
		
		if((PPP.spec.studio.source=="/manager/record" || PPP.spec.studio.source=="space" || PPP.spec.studio.source=="level") && PPP.config.context.rec_id=="0")
        {
            $("#tabUpper-split-pane-container").splitPane("collapseSecond","1.0");
        }
	}

	self.populateAssignee = function(){
        console.log("Assignee list");
        console.log(PPP.assignee);
        var assigneeList = PPP.assignee;

        for(var id in assigneeList){
            self.commentsByOptions.push({value: id + "", label: U.translate(assigneeList[id])});
        }
    };

	function loadMailFlagTypes() {
		var mailFlagTypes = ko.observableArray([]);
		var mailFlagTypeList = recordInfo.config.mail.mailFlagTypes;
		if (mailFlagTypeList) {
			for (var i = 0; i < mailFlagTypeList.length; i++) {
				var row = mailFlagTypeList[i];
				mailFlagTypes.push([row.value, row.name]);
			}
		}
		return mailFlagTypes();
	};

	var accept1 = function() {
		alert(111);
	}

	var accept2 = function() {
		alert(2222);
	}

	var openAutoCreateDialog = function(config) {
		if (!self.autoCreate) {
			self.autoCreate = new U.AutoCreate(config);
		}
		self.autoCreate.loadConfiguration(recordInfo.config);
		U.loadDefer("#auto-create-tmpl-defer").then(function(){
			self.autoCreate.openDialog(config, "auto-create-schedule", 400, 625);
		})
	}

	var openAutoCreateScheduleDialog = function(){
		// console.log("Inside openAutoCreateScheduleDialog");
		// console.log(PPP);

		if(PPP.data.upper.id == 0) {
			if(self.no_workflow){
				self.saveData("autoCreate");
			}else {
				self.saveDraft("autoCreate");
			}
		}else {
			openAutoCreateDialog(PPP);
		}
    }

    self.viewmap = function(){
    	//var latGeoPicker = $('#formUpper').find('geocode-picker');
    	var latGeoPicker = $('[unifier-id="geocode-picker"]');
    	if(latGeoPicker.length>0)
    		latGeoPicker.get(0).showMap(false);
    }

	self.chooseCurve = function(){
		var context = recordInfo.config.context;
		var url = "/bp/cashflow/checkCommitExist";
		var params = {commit_rec_id:context.rec_id, model:context.prefix};
		U.call(url,params,
				function(result){
					if(result.id != undefined && result.permcode != undefined){
						if((result.permcode == "011")||(result.permcode == "111")||(result.permcode == "001"))
						{
							recordInfo.config.cf_id = result.id;
							self.cashflowCurveOpen();
							return;
						}
					}else{
						U.loadDefer("#cashflow-creation-defer").then(function() {
							oj.Context.getContext($("#unifier-module-cashflowcreation-dialog")[0]).getBusyContext().whenReady().then(function(){
								var cashflowDialog = ko.dataFor(document.getElementById("unifier-module-cashflowcreation-dialog"));
								cashflowDialog.loadData();
							});
						});
					}
				}
		);
	}
	self.getFormTemplates = function(){
		var context = recordInfo.config.context;
		var url = "/bp/cashflow/templatelog/search?source=0"+"&model="+context.prefix+"&calledFrom=bpCommit"+"&propids=0";
		var params = {};
		var results;
		U.call(url, params,
				function(result){
					U.loadDefer("#cashflow-creation-defer").then(function() {
						var cashflowDialog = ko.dataFor(document.getElementById("unifier-module-cashflowcreation-dialog"));
						cashflowDialog.handletempresults(result);
					});
				}
		);

	}


    self.recordMenuItemSelect = function( event, ui ) {
        console.log("record.js: recordMenuItemSelect: event: " + event.name);

        if( ui && ui.item && ui.item.attr('data-action') ) {
            openToolBarMenus( {action: ui.item.attr('data-action'), label: ui.item.attr('data-label') } );
        }
    };

    var openToolBarMenus = function(item, event) {
        console.log("record.js: openToolBarMenus: " + item.action);
        // parent
        switch(item.action){
            case "autovue" :
                self.reviewAttachments('autovue');
                break;
            case "oui" :
                self.reviewAttachments('oui');
                break;
            case "addAssignee" :
                self.addAssignee();
                break;
            case "autocreate" :
                openAutoCreateScheduleDialog();
                break;
            case "bpo" :
               self.launchBPO();
                break;
            case "calendar" :
               self.openCalendar();
                break;
            case "cashflowcurveopen" :
               self.cashflowCurveOpen();
                break;
            case "ccUsers" :
               self.addCc();
                break;
            case "cfs" :
               self.launchCFS();
                break;
            case "chooseCurve" :
               self.chooseCurve();
                break;
            case "close" :
                self.closeCheck();
                break;
            case "CustomHelp" :
                self.CustomHelp();
                break;
            case "createBid" :
               self.createBid();
                break;
            case "deleteBid" :
               self.deleteBid();
                break;
            case "exportLiTemplate" :
               self.exportLineItemTemplate();
                break;
            case "funding" :
                self.funding();
                break;
            case "inviteBid" :
                self.openBid();
                break;
            case "importdrawingfile" :
                self.importDrawingFile();
                break;
                
            case "print" :
                self.print(item.action);
                break;
            case "printPDF" :
                self.print("printPDF");
                break;
            case "printHTML" :
                self.print("printHTML");
                break;
            case "customPrint" :
                self.print("printCustom");
                break;
           case "reload" :
                self.reloadData();
                break;
            case "sendUmail" :
                self.sendMail();
                break;
            case "showBid" :
                self.showBid();
                break;
            case "liHistory" :
            	self.openliHistory();
            	break;
            case "sov" :
                self.launchSOV();
                break;
             
            
            case "terminate" :
                self.terminateRecord();
                break;
            case "transferOwner" :
                self.transferOwnership();
                break;
            case "undotask" :
                self.undoAcceptTask();
                break;
            case "viewmap" :
                self.viewmap();
                break;
            case "withdrawBid" :
                self.withdrawBid();
                break;
            case "allocation" :
        		 self.launchAllocation();
            	break;
            case "create_lease_snapshot" :
        		 self.createSnapshots();
            	break;
            case "view_lease_snapshot" :
        		 self.viewSnapshots();
            	break;
            case "openUpkWindow" :
            	self.openUpkWindow();
				break;
            case "viewOnDrawingSpaces" : 
            	self.viewOnDrawingSpaces();
            	break;
            case "viewOnDrawingLevel" :
            	self.viewOnDrawingLevel();
				break;
            case "viewSpaces" :
            	self.viewSpaces();
				break;
            case "delplanning" :
            	self.deletePlanning();
            	break;
            case "recurrence" :
            	self.openReservationDialog("recurrence");
            	break;
            case "schedules" :
            	self.openReservationDialog("schedules");
            	break;
            case "cancelresv" :
            	self.cancelReservationvOpen();
            	break;
				
            default:
                debugger;
                self.accept1();
                break;
        }

    };

	window.createCommitCurve = function(isManual,cfTemplateid){
		var context = recordInfo.config.context;
		var url = "/bp/cashflow/detailCurve/openproperties";
		var params = {model: context.prefix, project_id: context.pid, record_id: context.rec_id, record_no: PPP.data.upper.record_no,copy:"yes",source:0,id:cfTemplateid,isFromBP:true,template:true};
		if(isManual)
			var params = {model:context.prefix, project_id: context.pid, record_id: context.rec_id, record_no: PPP.data.upper.record_no,copy:"yes",source:0,id:0,isFromBP:true,template:false,fromsheet:false};

		var windowName = "CashFlowWindow";
		   U.open(url, {name:windowName,w:840,h:680,method:'post'}, params);
	}

	self.cashflowCurveOpen = function(){
		var id = recordInfo.config.cf_id;
		var url ="/bp/cashflow/sheets/errorcheck";
		var context = recordInfo.config.context;
		var params = {sheet_id:id};
		U.ShowWaiting();
		U.call(url, params,
			function (result) {
    			U.CloseShowWaiting();
    			if(result.error != ''){
    				UAlert(result.error);
    				return ;
    			}
    			var url = '/bp/cashflow/sheets/mainsheet?sheet_id=' + id+'&isSnapShot=false&isSummary=false&currIndex=1';
    			oGraphWin = U.open(url, {name:"oGraphWin", w:925, h:700});
    			setTimeout(function() {oGraphWin.focus();}, 200);
			}
		);
	}

    self.launchBPO = function() {
        var url = "/bp/bpo/view?id="+recordInfo.config.context.rec_id+"&record_no=&model="+recordInfo.config.context.prefix;
        U.open(url, {name:"viewBPO", w:800, h:650});
    }
    
    self.openliHistory = function(){
    	//TODO: Check standard lines count..if zero return.    	
    	var budgetId = recordInfo.config.context.budgetid;
    	var refid = upperform.getField("refid").getValue();
    	var model = recordInfo.config.context.prefix;
    	var id = recordInfo.config.context.rec_id;
    	var uuu_content_id = 0;
    	var coID = recordInfo.config.context.rec_id;    	
    	var record_no = upperform.getField("record_no").getValue();
    	if(recordInfo.config.context.uuu_content_id != undefined)
    		uuu_content_id = recordInfo.config.context.uuu_content_id;	
    	var action="/bp/studio/bp/cost/opengrid?pref="+recordInfo.config.refcommitModel+"&unit_price_check="+refid+"&model=" + model + "&printable=5&coID="+coID+"&lisize="+0+"&refid="+refid+"&content_id="+uuu_content_id+"&edit_form=0&budgetId="+budgetId+"&fromlihistory=1&id="+id+ "&record_no="+record_no + "&fromOJET=1";    	
    	
    	/*if(!$no_workflow)
    		if (myform.${model}_id.value == "0")
    			action+="&task_id="+myform.task_id.value;
    		else
    			action+="&id="+myform.${model}_id.value;
    	else
    		action+="&id="+myform.${model}_id.value;
    	end*/
    	U.open(action, {name:"viewLiHistory", w:820, h:600});
    }

	self.launchSOV = function(){
		var map_create_psov = recordInfo.config.map_create_psov;
		var map_create_s_psov = recordInfo.config.map_create_s_psov;
		var map_reference_s_psov = recordInfo.config.map_reference_s_psov;
		var map_reference_sov = recordInfo.config.map_reference_sov;
		var map_reference_psov = recordInfo.config.map_reference_psov;
		var module = "sov";
		if(PPP.spec.studio.subtype === "cm") {
		    module = "gsov";
		}
		var url = "/bp/"+module+"/checkSOVCreated";
		var isPSOV=false;
		var commitModel = recordInfo.config.context.prefix;
		if(PPP.spec.studio.type == "commit"){
			var selectedid =recordInfo.config.context.rec_id;
			if(map_create_psov[recordInfo.config.context.prefix] || map_create_s_psov[recordInfo.config.context.prefix]){
				isPSOV=true;
				url ="/bp/psov/checkPSOVCreated";
			}
		}
		else if(PPP.spec.studio.type == "change_commit" || PPP.spec.studio.type == "spend" || PPP.spec.studio.type == "payment"){
			if(map_reference_psov[recordInfo.config.context.prefix] || map_reference_s_psov[recordInfo.config.context.prefix]){
				isPSOV=true;
				url ="/bp/psov/checkPSOVCreated";
			}
			commitModel = recordInfo.config.refcommitModel;
			var selectedid =upperform.getField("refid").getValue();
			if(typeof(selectedid)== "undefined" || selectedid == null || selectedid == "" || selectedid == 0 )
			{
				U.AlertByKey("select_ref_commit");
				return;
			}
		}
		var params = {recordid:selectedid};
		if(module === "gsov") {
		    params['commitModel'] = commitModel;
		}
		else {
		    params['commitmodel'] = commitModel;
		}
		U.ShowWaiting();
        U.call(url, params,
				function (result) {
        			U.CloseShowWaiting();
        			console.log("sov result: "+JSON.stringify(result));
		        	if (result.error == "Error")
		        		U.AlertByKey("sov_picker_no_sov_alert");
	                else
	                    self.viewCreated_sov(result,isPSOV, commitModel,module)
				}
		);

	}
	self.viewCreated_sov = function(sovresult,isPSOV, commitModel,module){
		var map_create_s_psov = recordInfo.config.map_create_s_psov;
		var map_reference_s_psov = recordInfo.config.map_reference_s_psov;
		var recordid = sovresult.commit_id;
		var url ="/bp/"+module+"/view?docid=0&recordid="+recordid;
		if(module === "gsov") {
		    url = "/bp/gsov/sheet/view?docid="+sovresult;
		}
		else if(isPSOV){
			url ="/bp/psov/view?docid=0&recordid="+recordid;//tested
			if(map_create_s_psov[recordInfo.config.context.prefix] || map_reference_s_psov[recordInfo.config.context.prefix]){
				url ="/bp/spasov/view?docid=0&recordid="+recordid+"&prefix="+commitModel;
			}
	    }
		U.open(url, {name:"viewSovs", w:800, h:650});
	}
	self.funding= function(){
		var disableFund = recordInfo.config.disableFund;
		var isTransient = recordInfo.config.isTransient;
		var rec_tot_amt = PPP.data.upper.amount;
		var CFS = recordInfo.config.context.cost_addl_info.is_cfs;
		if(CFS == "true"){
			self.cfsFunding(disableFund,isTransient);
			return;
		}
		var action = "/bp/fsm/bp/assign/log?recordid="+PPP.data.upper.xid+"&model="+recordInfo.config.context.prefix+"&recordnumber="+PPP.data.upper.record_no+"&readOnly="+disableFund+"&isTransient="+isTransient+"&taskId="+recordInfo.config.context.task_id+"&bpId="+recordInfo.config.context.rec_id+"&bpPrefix="+recordInfo.config.context.prefix;
		U.open(action, {name:"fundingOpen", w:800, h:620});
	}
	self.cfsFunding = function(disableFund,isTransient){
		var rec_tot_amt = PPP.data.upper.amount;
		var action = "/bp/cfs/bp/assign/log?recordid="+PPP.data.upper.xid+"&model="+recordInfo.config.context.prefix+"&recordnumber="+PPP.data.upper.record_no+"&readOnly="+disableFund+"&isTransient="+isTransient+"&taskId="+recordInfo.config.context.task_id+"&bpId="+recordInfo.config.context.rec_id+"&bpPrefix="+recordInfo.config.context.prefix+"&refid="+PPP.data.upper.k__refid;
		U.open(action, {name:"fundingOpen", w:800, h:620});
	}
	self.launchCFS = function(){
		var url = "/bp/cfs/checkCfsCreated";
		var context = recordInfo.config.context;
		var selectedid = context.rec_id;
		var commitModel = context.prefix;
		if(PPP.spec.studio.type == "change_commit"){//change the id and model accordingly
			selectedid = upperform.getField("refid").getValue();
			commitModel = recordInfo.config.refcommitModel;
		}
		var params = {recordid:selectedid,recxid:PPP.data.upper.xid,commitmodel:commitModel,project_id:context.pid,cost_type:PPP.spec.studio.type};
        U.ShowWaiting();
        U.call(url, params,
				function (result) {
        			U.CloseShowWaiting();
		        	if(result.error == "no_cfs_allowed"){
		                U.AlertByKey("no_cfs_allowed");
		                return;
		            }
		        	if (result.error == "Error"){
                         if(context.readonly || recordInfo.config.fundAssign == "false")
                             U.AlertByKey("cfs_not_created_view");
                         else
                             self.create_cfs(selectedid,commitModel);
	                }
	                else{
	                        self.viewCreated_cfs(result.commit_id)
	                }

				}
			);
	}
	self.create_cfs = function(selectedid,commitModel){
		var context = recordInfo.config.context;
		 U.ConfirmByKey("cfs_not_created", function(yn) {
		        if(yn) {
                 var action = "/bp/cfs/sheet/create?bp_id="+selectedid+"&bp_prefix="+commitModel+"&projectid="+context.pid;
                 U.open(action, {name:"cfsCreateOpen", w:800, h:650});
		        }
		 });
	}

	self.viewCreated_cfs = function(docid){
		var context = recordInfo.config.context;
		var editable = !context.readonly;
		var action = "/bp/cfs/sheet/open?docid="+docid+"&editable="+editable;
		U.open(action, {name:"cfsViewOpen", w:800, h:650});
	}

	self.openCalendar = function(){
		var context = recordInfo.config.context;
		var edit_form = 0;
		if(!context.readonly)
			edit_form = 1;
		
		self.bpCalendarDom = $("#bp-calendar-defer").get(0);
        ko.cleanNode(self.bpCalendarDom);

        ko.applyBindingsToNode(self.bpCalendarDom, {
            ojModule: {
                name: 'bp/bpCalendar',
                params: {
                	objtype : context.prefix,
            		projectid : context.pid,
            		objid : context.rec_id,
            		userid : recordInfo.config.context.curruserid,
            		qceAllow : true,
            		from_log : '',
            		allowReserveValue:getAllowReserveValue()
                }
            }
        });
		
        var $dialog = $("#" + "bp-calendar-pop");
        $dialog.ojDialog("open");
		/*var urlVar = "/bp/mod/bp/record/openCalendar/?objtype="+context.prefix + "/projectid=" + context.pid + "/edit_form=" + edit_form + "/objid=" + context.rec_id  +  
		"/userid=" + recordInfo.config.context.curruserid +  "/qceAllow=" + context.allow_quick_calendar_entry + "/" + true;	
		U.loadDefer("#bp-calendar-defer").then(function() {
			oj.Context.getPageContext().getBusyContext().whenReady().then(function (){
				
				 var bpCalendarContainer = ko.dataFor(document.getElementById("bpCalendarContainer"));
				
				 bpCalendarContainer.loadConfiguration({url:urlVar});
				 
			});  
		});*/
	}

    /*
        ** This function is a variation on checkUnSavedData().
        ** It is used to check for unsaved changes in tabs when the window is closing (like when the [X] is clicked.
    */
	self.isUnsavedData = function(fn) {
            var saveddata = function (yn){
                if(!yn){
                    return;
                }else {
                    fn();
                }
            }
            var rFn = function() {
                var comma = "";
                var unsavedtabs= "";

                // Unsaved data in comments
                if(PPP.vendorId == 0 && self.spec.studio.source != "text") {
                    self.commentModel = $("#tabUpper unifier-record-comment")[0];
                    if(self.commentModel && self.commentModel.extend().hasSavedData() === false) {
                        unsavedtabs += comma + "Comments in "+ PPP.spec.upper.label+" tab";
                        comma = ", ";
                    }
                }

                // Unsaved data in lineitem tabs
                _.each(self.detailInfo, function(detail){
                     var detailObj = self.detailInfo[detail.tabId];
                     if(detailObj && !detailObj.unchanged()) {
                        unsavedtabs += comma + detailObj.tab_name;
                        comma = ", ";
                     }
                });

                if(unsavedtabs != "") {
                    return U.translateMessage("bp_form_close_change_warning");
                } else{
                    return;
                }
            }
            return rFn;
        }

	 self.checkUnSavedData = function(fn) {
        var saveddata = function (yn){
            if(!yn){
                return;
            }else {
                fn();
            }
        }
        var rFn = function() {
            var comma = "";
            var unsavedtabs= "";

            //unsaved data in comments
            if(PPP.vendorId == 0 && self.spec.studio.source != "text") {
                self.commentModel = $("#tabUpper unifier-record-comment")[0];
                if(self.commentModel && self.commentModel.extend().hasSavedData() === false) {
                    unsavedtabs += comma + "Comments in "+ PPP.spec.upper.label+" tab";
                    comma = ", ";
                }
            }

            //unsaved data in lineitem tabs
            _.each(self.detailInfo, function(detail){
                 var detailObj = self.detailInfo[detail.tabId];
                 if(detailObj && !detailObj.unchanged()) {
                    unsavedtabs += comma + detailObj.tab_name;
                    comma = ", ";
                 }
            });

            if(unsavedtabs != "") {
              if(self.bclick != "" && self.bclick == "submitclick" || self.bclick == "sendclick" || self.bclick == "submitBidclick")
                   U.ConfirmByKey("unsaved_data_submit",unsavedtabs,saveddata);
               else
                   U.ConfirmByKey("unsaved_data_save",PPP.spec.upper.label,unsavedtabs, saveddata);
            } else{
                saveddata(true);
            }
        }
      return rFn;
    }
	 
	self.validateReservationDates = function(){
		if(typeof recordInfo.upperform!='undefined' && typeof self.spec.studio.type!='undefined' && self.spec.studio.type=="reservation"){
			var fromdate = recordInfo.upperform.getField("uuu_from_date").getValue();
			var todate = recordInfo.upperform.getField("uuu_to_date").getValue();
			var t1 = new Date(fromdate);
            var t2 = new Date(todate);
            if(t2.getTime() < t1.getTime()) {
            	U.AlertByKey("from_later_to_alert_reservation");
            	return true;
            }else{
            	return false;
            }
		}else{
			return false;
		}
	}

	self.mainToolActions = function(key){
		if(key === "save"){
			self.bclick = "saveclick";
			if(self.validateReservationDates()){
				return;
			}
			return self.no_workflow ? self.checkUnSavedData(self.saveData) : self.checkUnSavedData(self.saveDraft);
        }
		if(key === "submit") {
			self.bclick = "submitclick";
			return self.checkUnSavedData(self.sendData);
        }
		if(key === "send" || key === "complete") {
			self.bclick = "sendclick";
			if(self.validateReservationDates()){
				return;
			}
			return self.checkUnSavedData(self.openActionDialog);
        }
		if(key === "accept"){
			if(!self.showIstepWfMenu())
				return self.acceptTask;
		}
		if(key === "decline")
			return self.declineTask;
		if(key === "edit")
			return self.editData;
		if(key === "viewwf")
			return self.viewWF;
		if(key === "showerror")
			return self.displayErrorList;
		if(key === "close")
			return self.closeCheck;
       if(key === 'submitBid') {
            self.bclick = "submitBidclick";
            return self.checkUnSavedData(self.submitBid);
        }
        if(key === 'saveBidDraft') {
            self.bclick = "saveBidDraftclick";
            return self.checkUnSavedData(self.saveBidDraft);
        }
		if(key === "paymentmsgalert"){
        	return self.showpaymentmsg;
        }
	}

	//window.close triggers this event
	window.onbeforeunload = function(){
	    console.log("record.js:  window.onbeforeunload");

		var ev = window.event;
		var iX = window.document.body.offsetWidth;
		if (ev !== undefined && ev.clientX !== undefined) {
		    iX = window.document.body.offsetWidth - ev.clientX;
		}
		var iY = ev.clientY ;
		//have to take care inviteBidClickpublic for RFB
		var url = "/bp/studio/bp/BPReferenceLog/clearCache";
		var postData={
		    ref_model:recordInfo.config.context.prefix,
            ref_id: recordInfo.config.context.rec_id,
            userId: recordInfo.config.context.curruserid
		};
		U.call(url,postData,function(){
		    console.log("Reference records cache removed for "+recordInfo.config.context.prefix+"-"+recordInfo.config.context.rec_id );
		});

		// Bug 28803245 - Check to see if changes have been made in the tabs before the window closes.
		// Alternative 'if' condition: if (Arrays.equals(recordInfo.upperform.extend().updatedValues, parent.tempSnapShot)) {
		if(JSON.stringify(upperform.extend().updatedValues) == JSON.stringify(self.tempSnapShot)) {
		    //No modified DEs
		    console.log("record.js:  window.onbeforeunload:  No modified DEs. Checking tab data changes next.");
		    var checkUpdatesMadeFunc = self.no_workflow ? self.isUnsavedData(self.saveData) : self.isUnsavedData(self.saveDraft);
		    if (checkUpdatesMadeFunc()) {
		        // Changes have been made.
		        console.log("record.js:  window.onbeforeunload:  Changes were made in the tabs");
		        // The exact string reurned is irrelevant since it never gets displayed.
		        // Any non-null string causes the browser to display its own message which can no longer be customized.
		        return U.translateMessage("bp_form_close_change_warning");
		    }
		} else {
            // Changes have been made, but this will be caught in the next 'if' condition.
            // The exact string reurned is irrelevant since it never gets displayed.
            // Returning a string causes the "Leave site?" browser message to pop up, but message is not actually used.
            console.log("record.js:  window.onbeforeunload:  Changes were made in the upper form!");
            // return U.translateMessage("bp_form_close_change_warning");
		}

		if(!isCloseClick && !isSendClick && !isTerminateClick && !isAcceptTaskClick && !isEditTaskClick && !isBidButtonClick && !isInviteButtonClick ){
			if(JSON.stringify(upperform.extend().updatedValues) == JSON.stringify(self.tempSnapShot))//No modified DEs
				return;
			else{
				var mess = U.translateMessage("portal_bp_form_close_change_warning");
				event.returnValue = mess;
			}
		}
 	}

	self.closeWindow = function(){window.close()}

	self.closeCheck = function(){
		isCloseClick = true;
		//alert("updated values: "+JSON.stringify(upperform.extend().updatedValues));
		//alert("tempNapShot: "+JSON.stringify(self.tempSnapShot));
		
		var cb = function(yn) {
			if(yn)
				window.close();
			else
				return;
		};
		if(JSON.stringify(upperform.extend().updatedValues) == JSON.stringify(self.tempSnapShot)){//No modified DEs
			if(PPP.data.upper.process_status == -1)
				U.ConfirmByKey("portal_bp_form_close_change_warning", cb);
			else
				window.close();
		} else {			
			if(PPP.data.upper.process_status == -1)
				U.ConfirmByKey("portal_bp_form_close_change_warning", cb);
			else	
				U.ConfirmByKey("bp_form_close_change_warning", cb);
		}
	}
	self.getDraft = function(triggerContext) {
		var draft = {};
		draft.upper = upperform.extend().updatedValues;		
		if(upperform.getField("title")) {			
			draft.title = upperform.getField("title").getValue();
		}
		var task_id = recordInfo.config.context.task_id > 0 ? recordInfo.config.context.task_id : PPP.data.workflow.task_id;
		draft.task_id = task_id;
		draft.wftemplate_id = PPP.data.workflow.wftemplate_id;

		if (self.spec.studio.source === "text"){
			var elt = $(".bp-text-comment")[0];
			if (elt) {
				var commentModelObj = $(".bp-text-comment")[0].extend();
				if(typeof(commentModelObj)!= "undefined")
					draft.comments_content = commentModelObj.textAreaContent();	
			}
		}
		
		if(PPP.spec.studio.type == "payment" && recordInfo.config.context.uuu_content_id != undefined){
			draft.uuu_content_id = recordInfo.config.context.uuu_content_id;			
		}
		
		if(self.isTemplate) {
			draft.istemplate = true;
			draft.scheduleId = recordInfo.config.context.scheduleId;
			if(triggerContext && triggerContext == "fromBPTemplate") {
				self.prepareWorkflow();
				draft.workflowinfo = self.payload.workflowinfo;
				draft.changeStatus = "Complete";
			}
			else {
				draft.changeStatus = "Draft";
			}
		}
		return draft;
	}

	self.preparePayload = function() {
		var usersList = $('#notify_user_ids').ojInputText("option","value");
		var groupsList = $('#notify_group_ids').ojInputText("option","value");

		var data = upperform.extend().updatedValues;
		
		if(self.spec.studio.type == "reservation")
			data["uuu_recurrence"]=upperform.getValue("uuu_recurrence");

        //update qbt picker id here
       if(typeof(PPP.from_qbt) != "undefined" && PPP.from_qbt == 1) {
            if(typeof(PPP.qbt_ref_de) != "undefined" && typeof(upperform.getField(PPP.qbt_ref_de)) != "undefined"
                   && typeof(PPP.qbt_parent_id) != "underfined" && PPP.config.context.rec_id == 0) {
                var pickerField = upperform.getField(PPP.qbt_ref_de);
                data[pickerField.name] = PPP.qbt_parent_id;
            }
      }

       if(self.spec.studio.type == "reservation"){
    	   var fromdate = recordInfo.upperform.getField("uuu_from_date").getValue();
    	   var todate = recordInfo.upperform.getField("uuu_to_date").getValue();
    	   
    	    //date_start = U.date.parse(start_datetime, userDtFormat,self.G_locale);
     		//date_end = U.date.parse(end_datetime, userDtFormat,self.G_locale);
     		var nofdays  = self.timeDifference(new Date(todate),new Date(fromdate),"Calendar");
     		self.payload.context.duration = nofdays;
    	   
       }
       
 		if(typeof(usersList) != "undefined") {
			self.payload.notify_user_ids = usersList;
		}

		if(typeof(groupsList) != "undefined") {
			self.payload.notify_group_ids = groupsList;
		}

		if (recordInfo.config.context.rec_id != 0) {
			self.payload.update = { upper: data}
			self.payload.create = null;
		}
		else {
			self.payload.create = { upper: data}
			if(PPP.data.draft && PPP.data.draft.copyfrom)
			    self.payload.create.copyfrom = PPP.data.draft.copyfrom;
			self.payload.update = null;
		}

		if (self.spec.studio.source === "text"){
			var elt = $(".bp-text-comment")[0];
			if(elt) {
				var commentModelObj = $(".bp-text-comment")[0].extend();
				//if(!(self.context().readonly || self.context().endForm))
					//var commentModelObj_view = $(".bp-text-view-comment")[0].extend();
				if(typeof(commentModelObj)!= "undefined")
					self.payload.comments_content = commentModelObj.textAreaContent();
			}
		}
		if(PPP.data.workflow) {
		    //following terminal status check is done for records that are saved
		    //after it reaches end step.
		    if(recordInfo.config.context.isRecordEditor) {
                var wf = PPP.data.workflow;
                self.payload.workflowinfo = {
                        "task_id" : wf.task_id,
                        "process_id" : wf.process_id,
                        "wftemplate_id" : wf.wftemplate_id,
						"isRecordEditor" : recordInfo.config.context.isRecordEditor
                    }
		    }
		    else {
		        self.prepareWorkflow();
		    }
		}
	}

	self.prepareWorkflow = function() {

		if(recordInfo.config.context.rec_id == 0){
			var field = upperform.getField("due_date");
			if(field && field.getValue()) {
				upperform.updateValue("due_date", field.getValue());
			}
		}

		var toVal = actionDetail ? actionDetail.getValue("to") : "";
		var item = [];
		if (toVal.users)
			_.each(toVal.users, function(r) { item.push(r.id); });
		ace.to_user_list = item.join(",");

		item = [];
		if (toVal.groups)
			_.each(toVal.groups, function(r) { item.push(r.id); });
		ace.to_group_list = item.join(",");

		var ccVal = actionDetail ? actionDetail.getValue("cc") : "";
		item = [];
		if (ccVal && ccVal.users)
			_.each(ccVal.users, function(r) { item.push(r.id); });
		ace.cc_user_list = item.join(",");

		item = [];
		if (ccVal && ccVal.groups)
			_.each(ccVal.groups, function(r) { item.push(r.id); });
		ace.cc_group_list = item.join(",");

		var wf = PPP.data.workflow;
		var taskDates = "";
		if(selectedWF && selectedWF.nextStep && selectedWF.nextStep.defaultTaskDueDate && selectedWF.nextStep.defaultTaskDueDate != "") {
			taskDates = "allusers|" + selectedWF.nextStep.defaultTaskDueDate;
			if($("input:radio[name=radio_task_due_date]:checked").val() == 1) {
				var item = [];
				_.each(self.gridData, function(r) {
					item.push(r.key + "|" + U.DateTimeConverter.format(r.task_due_date));
				});
				taskDates = item.join(",");
			}
		}
		// console.log("taskDates ====> " + taskDates);

		if(self.isTemplate)	{
			self.payload.workflowinfo = {
									"task_id" : wf.task_id,
									"process_id" : wf.process_id,
									"picked_link_id" : pickedLinkId,
									"next_step_id" : selectedWF && selectedWF.nextStep ? selectedWF.nextStep.id : 0,
									"next_step_name" : selectedWF && selectedWF.nextStep ? selectedWF.nextStep.name : "",
									"wftemplate_id" : wf.wftemplate_id,
									"to" : toVal,
									"cc" : ccVal,
									"to_user_list" : ace.to_user_list,
                                    "to_group_list" : ace.to_group_list,
									"cc_user_list" : ace.cc_user_list,
                                    "cc_group_list" : ace.cc_group_list,
                                    "formid": recordInfo.config.context.formid,
									"auto_create_list" : autoCreateList.join(",")
								}
		} else{
			self.payload.workflowinfo = {
									"task_id" : wf.task_id,
									"process_id" : wf.process_id,
									"picked_link_id" : pickedLinkId,
									"next_step_id" : selectedWF && selectedWF.nextStep ? selectedWF.nextStep.id : 0,
									"wftemplate_id" : wf.wftemplate_id,
									"to_user_list" : ace.to_user_list,
									"to_group_list" : ace.to_group_list,
									"cc_user_list" : ace.cc_user_list,
									"cc_group_list" : ace.cc_group_list,
									"newTaskDates" : taskDates,
									"auto_create_list" : autoCreateList.join(",")
								}
		}
		autoCreateList = [];
		return;
	}


    self.openNewProcessWrapper = function(wf_id) {
      var detail = self.detailInfo[self.currentTabId];
      console.log("what is detail " + detail);
      if(detail.isNonWorkflow()) {
        wf_id = 0;
      } else if (wf_id === -1) {
        wf_id = detail.wf_templates[0].id;
      }
      self.openNewProcess(wf_id);
    };

    self.openNewProcess = function(wf_id) {
        self.invokeCreateNewProcess(wf_id);
    };

    self.invokeCreateNewProcess = function (wf_id) {
        self.createRecWindowName('bp_' + module_name + '_0');
        self.createNewRecordDialog.close();
        var width = '1080';
        var height = '620';
        if (PPP.studioSource === "document") {
            width = '1200';
            height = '620';
        }
        g_openRecWin = null;
        var context = recordInfo.config.context;
        var model = context.prefix;
        var qbt_ref_de;
        var module_name;
        var qbt_id;
        var no_workflow;
        var bp_type;

        if( self.spec.form.bp_tab) {
            _.each(self.spec.form.bp_tab, function(tab){
                if (tab.type === "queryTab" && tab.tab_id == self.currentTabId) {
                   qbt_ref_de = tab.de_name;
                   module_name = tab.bp_prefix;
                   qbt_id = tab.tab_id;
                   no_workflow = tab.no_workflow;
                   bp_type = tab.bp_type;
               }
            });
        }

        var pid = PPP.data.upper.project_id;
        var qbt_parent_id = PPP.data.upper.id;
        var from_qbt=1;

        U.call("/bp/mod/bp/record/isOjetEnabledBP/" + module_name,null,function(response){
            if(response.hasOJETForm) {
                if (no_workflow+"" === "true"){
                	 if(PPP.spec.studio.source === "space"){
                     	qbt_parent_id = PPP.data.upper.space_common_id;
                     }
                     var srcUrl = "/bp/mod/bp/record/new/" + module_name + "/" + pid + "/" + wf_id + "/" + from_qbt + "/" + qbt_ref_de + "/" + qbt_parent_id + "/" + qbt_id;
                     srcUrl += "?__uref=" + U.uref;
                     window.open(srcUrl, 'oj_bp_' + module_name + '_0', "resizable=yes,statusbars=no,menubars=no,addressbars=no,scrollbars=yes,left="+(screen.width-1030)/2+",top="+(screen.height-620)/2+",height=620,width=1080");
                }
                else
                {
                    var srcUrl = "/bp/mod/bp/record/new/" + module_name + "/" + pid+ "/" + wf_id + "/" + from_qbt + "/" + qbt_ref_de + "/" + qbt_parent_id + "/" + qbt_id;
                    srcUrl += "?__uref=" + U.uref;
                    window.open(srcUrl, 'oj_bp_' + module_name + '_0', "resizable=yes,statusbars=no,menubars=no,addressbars=no,scrollbars=yes,left="+(screen.width-1030)/2+",top="+(screen.height-620)/2+",height=620,width=1080");
                }
            }
            else {
                if (no_workflow+"" === "true"){
                        if(module_name.indexOf("usp_")==0) //To identify if call is for new Space/Level record in QBT
                        {
                            var action = "$/bp/studio/bp/spaceQBTinBP?module_name="+module_name+"&a=form.0&b="+module_name+"&bpcsvimport="+
                            0+"&project_id="+pid+"&qbt_id="+qbt_id;
                        }
                        else
                        {
                            var action = "/bp/studio/bp/bpQBTinspace?module_name="+module_name+"&a=form.0&b="+module_name+"&bpcsvimport="+
                            0+"&project_id="+pid+"&qbt_id="+qbt_id;
                        }
                }
                else {
                    if(PPP.data.upper.id > 0){
                        var action = "/bp/studio/bp/bpQBTinspace?fromMasterLog=1&wftemplate_id="+wf_id+"&module_name="+module_name+"&csvimport="+
                                        false+"&project_id="+pid+"&qbt_id="+qbt_id;
                       }
                    else{
                        var action = "/bp/process/new?fromMasterLog=1&wftemplate_id="+wf_id+"&module_name="+module_name+"&csvimport="+
                                            false+"&project_id="+pid+"&qbt_id="+qbt_id;
                    }
                }
                 action += "&qbt_parent_id="+qbt_parent_id+"&qbt_parent_type="+model+"&from_qbt=1&qbt_ref_de="+qbt_ref_de;
                 window.open(action, 'oj_bp_' + module_name + '_0', "resizable=yes,statusbars=no,menubars=no,addressbars=no,scrollbars=yes,left="+(screen.width-1030)/2+",top="+(screen.height-620)/2+",height=620,width=1080");
            }
     },false,function(response){
            U.Alert(response.error_message ? response.error_message : response.message);
        });
    };

	self.requireSilentSave = function() {
		var ctxt = recordInfo.config.context;
		if (ctxt.no_workflow && ctxt.rec_id != 0)
			return Promise.resolve({errors:[]});
		if (!ctxt.no_workflow && ctxt.task_id != 0)
			return Promise.resolve({errors:[]});
		return self.silentSave();
	}
	
	self.silentSave = function() {
        return new Promise(function(resolve, reject) {
            var url = '/bp/mod/bp/record/save';
            var data = {};
            if(!self.no_workflow) {
                url = '/bp/mod/bp/record/savedraft';
                data = self.getDraft();
            }
            else { //do error check only for non-workflow bps
                //var errorControl = upperform.extend().validateData();
            	self.setValidationForm(upperform,"upper");
                var errorControl = self.getErrorControl();
                if(errorControl && errorControl.errors.length > 0) {
                //if(errorControl.errors.length > 0){
                    //resolve({errors: errorControl.errors});
                    self.displayErrorList();
                    reject(errorControl);
                    return;
                } else {
                	self.btnError(false);
                }
                self.preparePayload();
                data = self.payload;
            }
            if(self.spec.studio.type == "payment"){
            	if(recordInfo.config.context.checkcreatesovsnapshot){
            		data.uuu_content_id = recordInfo.config.context.uuu_content_id;
            		data.prefix = recordInfo.config.context.prefix;  
            		data.refid = recordInfo.upperform.getField("refid").getValue();
            	}
            }
            	
            // console.log("silent save before submit "+ JSON.stringify(data));
            U.rest('POST', url, data,
                function(response) {
                    // console.log("response received step 2" + response.errors.length);
                    if(response.errors.length == 0) {                    	
                    	if(self.spec.studio.type == "payment"){
                    		if(recordInfo.config.context.checkcreatesovsnapshot){
                    			//load latest uuu_content_id.
                    			recordInfo.config.context.uuu_content_id = response.uuu_content_id;
                    			recordInfo.config.context.checkcreatesovsnapshot = false;
                    		}
                    	}
                    	
                        if(self.no_workflow) {
                            //if(triggerFrom != "additionalNotification"){
            					upperform.loadValues(response.upper);
            				//}

                            recordInfo.config.context.rec_id = response.upper.id;//local variable used in many places
                            U.Event.publish('record_id_changed',[recordInfo.config.context.rec_id,response.upper.record_no]);
                        }
                        else {
                            //self.recordInfo.config.context.task_id = response.out.taskId;
                            recordInfo.config.context.task_id = response.draft.taskId; //local variable used in many places
                    		upperform.extend().taskId = recordInfo.config.context.task_id;
                            recordInfo.config.context.process_id = response.process_id;
							
							self.addComment();
                            U.Event.publish('task_id_changed',recordInfo.config.context.task_id);
                        }
						
                        // console.log("recid after save "+recordInfo.config.context.rec_id);
                        resolve(response);
                    }
                    else {
                    	//console.log("coming into else with errors - "+JSON.stringify(response.errors));
                    	//console.log("error on silent save ");
                    	if(self.spec.studio.type == "payment"){
                    		recordInfo.config.context.checkcreatesovsnapshot = true;
                    		if(recordInfo.config.context.checkcreatesovsnapshot){                    			                    			
                    			recordInfo.config.context.checkcreatesovsnapshot = false;
                    			$("#record-tabs").ojTabs("option","selected","tabUpper-");
                    		}
                    		if(!Array.isArray(response.errors))
                    			U.Alert(response.errors);
                    		else
                    			U.Alert(response.errors[0]);
                    		reject(response);
                    		return;
                    	}
                        U.Alert(response.errors[0]);
                        reject(response);
                        //console.log("after display error list");
                       // return;
                    }
                },
                function(err, status) {
                    var errStr = "Error1:"+err.message+" Status:"+status;
                    U.Alert(errStr);
                    reject({errors: errStr});
                }
            )
        });
	}

	self.saveData = function(triggerContext) {
		// console.log("Inside saveData");
		var errorControl = upperform.extend().validateData();
		if(errorControl.errors.length > 0){
			self.setValidationForm(upperform,"upper");
			self.displayErrorList();
			return;
		} else {
			self.btnError(false);
		}
		self.preparePayload();
		if(PPP.spec.studio.params.master_vendor == "1"){
			self.checkVendorUserId(triggerContext);
		}
		else
			self.actualSaveData(triggerContext);

	}

	self.actualSaveData = function(triggerContext){
        var cb = function(){
		    if(typeof(PPP.qbt_id) != "undefined" && PPP.from_qbt == 1) {
		        window.opener.refreshQbtTab(PPP.qbt_id);
		    }
			else {
            window.opener.submit_search();
            }
            if(recordInfo.config.context.isRecordEditor)
                window.close();
        }
		//alert(JSON.stringify(self.payload));
		U.rest('POST', '/bp/mod/bp/record/save', self.payload,
			function(response) {
				U.CloseShowWaiting();
                if(response.errors.length > 0){
                   // console.log("Error in Creation::" +JSON.stringify(response.errors));
                    //self.displayErrorList(response.errors);
                	U.Alert(response.errors[0]);
                } else {
                	// console.log(response);
                	upperform.extend().updatedValues = {}; // for non-workflow save
                	//self.tempSnapShot = {};
					if(self.payload.context.rec_id == 0) {
						if(triggerContext == "additionalNotification") {
							if(self.no_workflow && self.isNotifyUsersEnabled() && response.upper.id > 0) {
								// console.log("saveData() trigger context : additionalNotification");
							}
						}else if(triggerContext == "autoCreate"){
							PPP.data.upper.id = response.upper.id;
							recordInfo.config.context.rec_id = response.upper.id;
							openAutoCreateDialog(PPP);
						}else {
					   		 recordInfo.config.context.rec_id = response.upper.id;
					   		 U.Event.publish('record_id_changed',[recordInfo.config.context.rec_id,response.upper.record_no]);
							 U.Notification(U.translateMessage("created_successfully",response.upper.record_no),cb);
						}
					}
					else {
					    recordInfo.config.context.rec_id = response.upper.id;
					    U.Notification(U.translateMessage("record_saved_successfully",response.upper.record_no),cb);
					}
                }
			},
			function(err, status) {
				U.Alert("Error1:"+err.message+" Status:"+status);
			}
		)
	}


	self.saveDraft = function(triggerContext) {
		// console.log("Inside saveDraft");
		//alert(JSON.stringify(self.getDraft()));
		if (recordInfo.config.context.isRecordEditor) {
			self.saveData();
			return;
		}

                var url = "/bp/mod/bp/record/savedraft";
                var data = self.getDraft(triggerContext);

                U.rest('POST', url, data,
                    function(response) {
                        U.CloseShowWaiting();
                        if(response.errors.length > 0){
                            U.Alert("Error in saving draft::" +JSON.stringify(response.errors));
                        } else {
                            if(data.terminalSave) {
                                isCloseClick = true;
                                window.opener.submit_search();
                                window.close();
                            }
                            else {
                                self.tempSnapShot = upperform.extend().getUpdatedData();
                                recordInfo.config.context.task_id = response.draft.taskId; //local variable used in many places
                                if(triggerContext == "autoCreate"){
									PPP.data.upper.id = response.out.id;
									openAutoCreateDialog(PPP);
                                }else{
                                    if(triggerContext == "fromBPTemplate") {
                                        self.closeActionDialog();
                                        window.opener.submit_search("refreshbptemplatelog");
                                        window.close();
                                    }
                                    else {
                                        if(response.draft.istemplate) {
                                            U.AlertByKey("bp_template_saved");
                                            window.opener.submit_search("refreshbptemplatelog");
                                        }
                                        else {
                                            U.AlertByKey("save_draft");
                                        }
                                    }
                                }
                            }
                        }
                    },
                    function(err, status) {
                        U.Alert("Error1:"+err.message+" Status:"+status);
                    }
                )
             }

	self.openActionDialog = function() {

		if((self.isTemplate && self.templateStatus == "Complete") || recordInfo.config.context.bpSendComplete) {
			// View WF Scenario - So no error validations done
		} else {
			var errorFound = false;
			self.setValidationForm(upperform,"upper");
			var errorControl = self.getErrorControl();
			if(!upperform.showValidationErrors())
				errorFound = true;
			if(errorControl && errorControl.errors && errorControl.errors.length > 0)
				errorFound = true;

			if(errorFound) {
				self.displayErrorList();
				return;
			}
			else {
				self.btnError(false);
            }
		}

		U.loadDefer("#loadActionDetailDialog").then(function(){
			$("#wfSend").ojButton("option", "disabled", true);

			$("#actionDetailDialog").ojDialog("open");
		})
	}

	self.onActionDetailDialogOpen = function( event, ui ) {
		var $widget = $("#actionDetailDialog").ojDialog("widget");
		$widget.css({"top":(Math.round($(window).height() - $widget.height())/2) + "px"});

		loadActionDetail();
	}

	self.closeActionDialog = function() {
		if(recordInfo.config.context.bpSendComplete) {
			recordInfo.config.context.bpSendComplete = false;
			autoCreateList = [];
		}
		$("#actionDetailDialog").ojDialog("close");
	}
	self.sendData = function() {
                var errorFound = false;
                self.setValidationForm(upperform,"upper");
                var errorControl = self.getErrorControl();
                if(!upperform.showValidationErrors())
                    errorFound = true;
                if(errorControl && errorControl.errors && errorControl.errors.length > 0)
                    errorFound = true;

                if(errorFound) {
                    self.displayErrorList();
                    return;
                }else {
                    self.btnError(false);
                }

                if(PPP.data.workflow) {

                    if(pickedLinkId === 0) {
                        U.AlertByKey("select_action");
                        return;
                    }

                    if(selectedWF && selectedWF.nextStep.type != 3){
                        var toVal = actionDetail.getValue("to");
                        if(!(toVal.users || toVal.groups)) {
                            U.AlertByKey("select_assignee");
                            return;
                        }
                    }
                }
                var sendDataCb = function(yn){

                    if(!yn) {
                        shellCreationValDone = false;
                        return;
                    }

                    if(PPP.data.workflow) {
                        if(!clickSStep) {
                            var nextLink = selectedWF.nextLink;
                            if(nextLink && nextLink.autoCreationMode === "2") {
								var bpList = nextLink.autoCreationBPs;
								if(bpList.length > 0) {
									U.loadDefer("#loadAutoCreateSStep").then(function(){
										$("#autoCreateSStep").ojDialog("open");
										loadSStepGrid(bpList);
									})
									return;
								}
                            }
                        }
                    }
                    if(recordInfo.config.context.rec_id == 0 || self.spec.studio.source === "simple"){
                        isSendClick = true;
                        if(PPP.spec.studio.params.master_vendor == "1"){
                            self.checkVendorUserId("submit");
                        }
                        else
                        self.submitRecordData();
                    }
                    else{
                       if(self.spec.studio.source == "rfb"){
                            if(upperform.getField("uuu_rfb_winning_bid")) {
                                var selectedWinningBidVal = upperform.getField("uuu_rfb_winning_bid").getValue();
                                if(typeof(selectedWinningBidVal) != "undefined" && selectedWinningBidVal != null && selectedWinningBidVal != "") {
                                    winningBidExists = true;
                                 }
                            }
                        }
                        self.validateLineitems().then(function(response){
                            if(response.errors) {
                                $("#actionDetailDialog").ojDialog("close");
                                if(((self.spec.studio.type == "commit"||  self.spec.studio.type == "change_commit") && self.spec.form.bp_tab["0"].params.costedeqlineitem == "1")
                                                || winningBidExists){
                                    self.btnDelAllLines(false);
                                }
                                else {
                                    self.btnDelAllLines(true);
                                }
                                self.serverErrors = response.errors;
                                self.setValidationForm(upperform,"upper");
                                self.displayErrorList();
                                clickSStep = false;
                            }
                            else {
                                self.btnError(false);
                                isSendClick = true;
                                if(PPP.spec.studio.params.master_vendor == "1"){
                                    self.checkVendorUserId("submit");
                                }
                                else
                                self.submitRecordData();
                            }
                        });
                       }
                    }

                var checkShellCreationStatus = false;
                if(self.spec.studio && self.spec.studio.subtype == "shell_creation" && self.spec.studio.type == "shell") {
                    var creationStatus = self.spec.studio.creation_status;
                    if(PPP.data.workflow) {
                        if(selectedWF && selectedWF.nextLink && typeof(creationStatus[selectedWF.nextLink.actionStatus]) != "undefined")
                            checkShellCreationStatus = true;
                    } else{
                        var status = upperform.getValue("status");
                        if(status && typeof(creationStatus[status]) != 'undefined'){
                            checkShellCreationStatus = true;
                        }
                    }
                    if(!shellCreationValDone && checkShellCreationStatus) {
                            var context = recordInfo.config.context;
                            var task_id = 0;
                            if(PPP.data.workflow && context.rec_id == 0) {
                                task_id = context.task_id;
                            }
                            U.call("/bp/studio/bp/li_count", {id: context.rec_id, model: context.prefix, task_id: task_id, no_workflow : self.no_workflow},
                                function (result) {
                                    if(result.count == 0) {
                                        shellCreationValDone = true;
                                        U.ConfirmByKey("shell_creation_li_empty",sendDataCb);
                                    } else {
                                        sendDataCb(true);
                                    }
                                }
                            );

                    } else{
                        sendDataCb(true);
                    }
                }
                else{
                    sendDataCb(true);
                }
            }

	self.checkVendorUserId = function(from){
		if(  recordInfo.config.context.rec_id > 0
			&& typeof(PPP.data.upper.uuu_user_id) != "undefined"
			&& typeof(upperform.extend().updatedValues.uuu_user_id) != "undefined"
			&& PPP.data.upper.uuu_user_id != upperform.extend().updatedValues.uuu_user_id) {
			  var cb = function(yn){
                    if(yn){
                    	if(from == "submit")
                    		self.submitRecordData();
                    	else
                    		self.actualSaveData(from);
                    }
                    else{
                    	//myform.${model}_uuu_user_id.value = PPP.data.upper.uuu_user_id;
                    	upperform.setValue("uuu_user_id",PPP.data.upper.uuu_user_id);
                    	return;
                    }
                };
			  U.ConfirmByKey("bidder_email_change",cb);
		  	}
		  	else{
		  		if(from == "submit")
            		self.submitRecordData();
            	else
            		self.actualSaveData(from);
		  	}
	}
	var ruleOverrideResubmit = false;
	self.submitRecordData = function(){

		if(self.isTemplate) {
			self.saveDraft("fromBPTemplate");
			return;
		}
		if(!ruleOverrideResubmit)
		    self.preparePayload();
		//alert(JSON.stringify(self.payload));
		// console.log("send data payload : " + JSON.stringify(self.payload));

		var cb = function(){
		    if(typeof(PPP.qbt_id) != "undefined" && PPP.from_qbt == 1) {
		        window.opener.refreshQbtTab(PPP.qbt_id);
		    }
		    else if(PPP.bulkautoaccept === "1") {
		        window.opener.submit_ba_search();
		    }
			else {
                 window.opener.submit_search();
            }
            window.close();
        }
		U.ShowWaiting();
		U.rest('POST', '/bp/mod/bp/record/make', self.payload,
			function(response) {
				U.CloseShowWaiting();
				if(response.errors.length > 0){
					clickSStep = false;
					if(response.rule_error) {
						U.loadDefer("#rule-exception-div-defer").then(function(){
							oj.Context.getContext($("#rule-exception-div")[0]).getBusyContext().whenReady().then(function(){
								$("#rule-exception-div")[0].showDialog(response.ruleinfo);
							})
	                    });
					}
					else if(response.fund_error) {
						U.loadDefer("#fund-exception-div-defer").then(function(){
							oj.Context.getContext($("#fund-exception-div")[0]).getBusyContext().whenReady().then(function(){
					    		$("#fund-exception-div")[0].showDialog(response.fundinfo);
							})
					    });
					}
					else if(response.errorMsgs!=null){
						if(response.errorMsgs.isCopy){
							self.isRepublishCopy(true);
							self.republishMessage(U.translateMessage("dm_copy_no_permission_on_republish", response.errorMsgs.node_path));//response.errorMsg.node_path));
						}else if(response.errorMsgs.isMove){
							self.isRepublishMove(true)
							self.republishMessage(U.translateMessage("dm_move_no_permission_on_republish", response.errorMsgs.node_path));//response.errorMsg.node_path));
						}else{
							return;
						}
						self.republishErrors(response.errorMsgs.errorFiles);
						$("#republishDialog").ojDialog("open");
					}
					else {
					    U.Alert(response.errors[0]);
					}
				} else {

				    ruleOverrideResubmit = false;
					if(!self.no_workflow) {
					    $("#actionDetailDialog").ojDialog("close");
					}
					if(response.out.create) {
					    // Bug 29423112 - Set setExitCallBack() on the dialog to close it when user presses the [X] button.
					    var successDialog = U.Notification(U.translateMessage("created_successfully",response.out.create.upper.record_no),cb);
					    successDialog.setExitCallBack(
					        function(data, event) {
					            // errorDialog.stopEvent(data,event);
					            return errorDialog.close(true);
					        }
					    );
					}
					else {
					    cb();
					}
				}
			},
			function(err, status) {
				U.Alert("Error2:"+err.message+" Status:"+status);
			}
		)
	}
	self.validateLineitems = function(){
		 return new Promise(function(resolve, reject) {
				var context = recordInfo.config.context;
                var studioType = self.spec.studio.type;
                if((studioType == "commit"|| studioType == "change_commit") && self.spec.form.bp_tab["0"].params.costedeqlineitem == "1"){ // SPA BP Lineitems Validation
                   U.call("/bp/studio/bp/cost/spa_validate_costed_amounts", {id:PPP.data.upper.id, model: context.prefix, task_id:recordInfo.config.context.task_id},
                        function (result) {
                          if(result.size != 0){
                            var errList = [];
                            var tabIdCheckObj = {};
                            for(var i = 0; i < result.size; i++){
                                var errObj = {};
                                if (result.Result[i].uuu_cost_li_type == 1)
                                    var msg = U.translateMessage("costed_amt_eq_li_lumpsum");
                                if (result.Result[i].uuu_cost_li_type == 2)
                                    var msg = U.translateMessage("costed_qty_eq_li_unitcost");
                                var short_desc = result.Result[i].short_desc;
                                var li_num = result.Result[i].li_num;
                                if(li_num > 9 && li_num <= 99) li_num = "0"+li_num;
                                else if(result.Result[i].li_num > 0 && result.Result[i].li_num <= 9) li_num = "00"+li_num;
                                else li_num;
                                errObj[1] = msg;
                                errObj[0] = self.spec.form.bp_tab["0"].tab_name + " : "+U.translate('Row')+" "+ li_num ;
                                errList.push(errObj);
                             }
                             self.isValidateLineitem = true;
                             resolve({errors: errList});
                        }
                   });
                }
				U.call("/bp/studio/bp/process_lineitems", {id:PPP.data.upper.id, model: context.prefix, form_id:recordInfo.config.context.formid,winningBidExists : winningBidExists, ojet:true},
		            function (result) {
			              if(typeof(result.detailErrorList)!="undefined" && result.detailErrorList.length > 0)
			        	  {
			            	  var errList = [];
			            	  var detailErrorList = [];
			            	  
			            	  self.delLineIds = result.detailIds;
			            	  var j= 0;
			            	  var tabIdCheckObj = {};
			            	  if(typeof(result.pmbError) != "undefined" && result.pmbError != "") {
			            		  detailErrorList.push(result.detailErrorList);
			            	  }
			            	  else{
			            		  detailErrorList = result.detailErrorList;
			            	  }
			            	  for(var i = 0; i < detailErrorList.length; i++){
                                var errObj = {};
			            		  var errstr = detailErrorList[i];
			            		  var ind = errstr.lastIndexOf("~~");
			            		  var msg = errstr.substring(ind+2, errstr.length);//Message
			            		  var pref = errstr.substring(0,ind);
			            		  var str = pref.split("~~");
			            		  var rowValue = self.liIndex(str[0]);//row value
                                  errObj[1] = msg;

			            		  var tabs = self.spec.form.bp_tab;
                                for(var ii=0; ii<tabs.length; ii++){
                                  if (tabs[ii].tab_id == str[1]) {
                                      var tabId = str[1];
                                      if( typeof(tabIdCheckObj[tabId]) == "undefined"){
                                          tabIdCheckObj[tabId]=tabId;
                                          self.delTabIds[j] = tabId;
                                          j++;
                                      }
                                      errObj[0] = tabs[ii].tab_name + " : "+ U.translate('Row')+" "+ rowValue ;
                                  }
			            		  }
                                errList.push(errObj);
			            	  }
			            	  self.isValidateLineitem = true;
			            	  console.log(errList);
			            	  resolve({errors: errList});
			        	  }
			              else{
			            	  console.log(result);
			            	  resolve(result);
			            	  
			              }

		            }
		        );
		 });
	}

	self.liIndex = function(inputStr)
	{
	   var r = "0";
	   var rNum = inputStr;
	   for (i=0; i<(3-inputStr.length); i++)
	   		rNum = "0" + rNum;

	   return rNum;
	}


	self.deleteAllErrorLines = function(){
		if(self.delLineIds != ""){
			var payload = {
	                prefix : recordInfo.config.context.prefix,
	                rec_id : recordInfo.config.context.rec_id,
	                selected_ids : self.delLineIds,
	                task_id: recordInfo.config.context.task_id,
	                formid: recordInfo.config.context.formid,
	                voiditem: false

	            };
				U.ShowWaiting();
	            U.rest('POST', '/bp/mod/bp/record/deletelineitems', payload,
	            function(response) {
	                U.CloseShowWaiting();
	                if(response.errors.length > 0){
	                    U.Alert("Error in deleteAllErrorLines::" +JSON.stringify(response.errors));
	                } else {
						recordInfo.upperform.extend().applySumOfDetail(response.sumofdetailmap);
	                	var erroListPopup =  $('#errorlist-popop');
	                	erroListPopup.ojPopup('close');
	                	for(var i=0; i<self.delTabIds.length; i++){
	                		var tabId = self.delTabIds[i];
	                		var tab = 'tab' + tabId;
	                			var ulog = document.getElementById(tab + '-log').extend();
	                			ulog.invokeRefresh();
	                			self.isValidateLineitem = false;
	                			self.btnError(false);
	                			self.serverErrors = [];
	                	}
	                }
	            },
	            function(err, status) {
	                U.Alert("Error2:"+err.message+" Status:"+status);
	            });
		}
	}
	self.acceptTask = function() {
		isAcceptTaskClick = true;
		var wf = PPP.data.workflow;
		var context = recordInfo.config.context;
		// console.log("wf ====> " + JSON.stringify(wf));
		if(wf.istep === true) {
			if(self.no_workflow) {
				var  action ="/bp/studio/workflow/initiate_bp/accept/istep?nonworkflow=yes&source=" + self.spec.studio.source + "&initiateBP=yes";
				   // action += "&qbt_id="+detail.tabId+"&from_qbt=1";
				var params = {
								nonworkflow : "yes",
								source : self.spec.studio.source,
								model : context.prefix,
								initiateBP : "yes",
								task_id : wf.task_id,
								id : context.rec_id,
								project_id : context.pid
				}

				U.ShowWaiting();
				U.call(action, params, function(response) {
						// console.log("response: " + JSON.stringify(response));
						U.CloseShowWaiting();
						if(response.error) {
							U.Alert(response.message);
							return;
						}
						window.opener.submit_search();
						var srcUrl = "/bp/mod/bp/record/open/" + context.prefix + "/" + context.rec_id;
							srcUrl += "?__uref=" + U.uref;
							srcUrl += "&project_id=" + context.pid;		
						U.replaceLocation(srcUrl);
						$("#record-container").html(U.getProcessingDotsHTML());
				 });
			}
			else{
				//alert("Initiation Task - Not Supported for Workflow BPs as of now.");
				//Case of only 1 wf template which is the default.
				if(wf.actions.length == 0) {
					U.AlertByKey("no_assigned_template_alert", function(){
						window.close();
					});
				} else{
					self.acceptIStepWF(wf.actions[0]);
				}
			}

		} else{

			U.ShowWaiting();
			U.call("/bp/mod/wf/tasks/accept/" + wf.task_id,null,function(response){
				U.CloseShowWaiting();
                if(typeof(PPP.qbt_id) != "undefined" && PPP.from_qbt == 1) {
                        window.opener.refreshQbtTab(PPP.qbt_id);
                } else {
				window.opener.submit_search();
				}
				U.replaceLocation("/bp/mod/bp/record/opentask/" + wf.task_id + "/" + PPP.from_qbt + "/" + PPP.qbt_id);
				$("#record-container").html(U.getProcessingDotsHTML());
			},false,function(response){
				U.CloseShowWaiting();
				U.Alert(response.error_message ? response.error_message : response.message);
			});
		}
	}
	self.editData = function(){
		isEditTaskClick = true;
		var context = recordInfo.config.context;
		window.isTopWindow = true;
		var url = "/bp/mod/bp/record/edit";
		var params = {record_id: context.rec_id,model:context.prefix};

		if(self.isTemplate) {

		    U.ConfirmByKey("confirm_template_status_change", function(yn) {
		        if(yn) {
                    url = "/bp/mod/bp/record/opendraft/"+context.draft_id
                         + "?isTemplate=true&templateStatus=Draft&changeStatus=Draft";
                    U.replaceLocation(url);
                    $("#record-container").html(U.getProcessingDotsHTML());
		        }
		    });
		}
		else {
            U.ShowWaiting();
            U.call(url, params, function(response){
                U.CloseShowWaiting();
                if(typeof(PPP.qbt_id) != "undefined" && PPP.from_qbt == 1) {
                        window.opener.refreshQbtTab(PPP.qbt_id);
                } else {
                    window.opener.submit_search();
                }
                var srcUrl = "/bp/mod/bp/record/open/" + context.prefix + "/" + context.rec_id + "/" + PPP.from_qbt + "/" + PPP.qbt_id;
                srcUrl += "?project_id=" + context.pid;
                U.replaceLocation(srcUrl);
                $("#record-container").html(U.getProcessingDotsHTML());
            });
		}
	}

	self.terminateRecord = function(caller) {
		//logic is there for BPO- Need to be added later when we work on those Bps.
		//logic for ruleoverriden[terminate confirmation should not be there if ruleoverriden is set]
		var isNWF = self.no_workflow;
		var context = recordInfo.config.context;
		var terminalStatus = self.spec.studio.terminal_status;
		var upper = PPP.data.upper;
		var  action = "/bp/studio/workflow/form/terminate";
		window.isTopWindow = true;

		if (!(isNWF && self.spec.studio.type != "reservation")) {
			if (typeof(terminalStatus[upper.status]) != 'undefined') {
				U.AlertByKey("cannot_terminate_nwf")
				return;
			}
		} 
		if (!isNWF) {
			if(context.currentSteptype == "END")
			{
				U.AlertByKey("terminate_record_closed")
				return;
			}
		}
		if (upper.status == "Terminated") {     //both for WF and NWF
			U.AlertByKey("record_already_terminated_alert");
			return;
		}
		U.ShowWaiting();
        var cb = function(yn) {
        	if (!yn) {
        		U.CloseShowWaiting();
        		return;
        	}
        	isTerminateClick = true;
        	var params = {};
        	if (isNWF) {
        		action = "/bp/studio/bp/terminate";
        	}
        	else
        		action = "/bp/studio/workflow/form/terminate";
        	 if (!isNWF) {
        	    params["process_id"] = PPP.data.workflow.process_id;
        	 }

             params["model"]      = context.prefix;
             params["srcid"]      = PPP.data.upper.id;
             params["id"]      = PPP.data.upper.id;
             params["project_id"] = context.pid;
             params["fromOjetBpForm"] = true;
             params["record_no"]=PPP.data.upper.record_no;
             params["is_nwf"] = isNWF;
             params["__uref"] =  U.uref;
             params["cost_db_model"] = self.spec.studio.source == "cost" ? "cost_ds" : "";

             if (caller) {
                params["ruleOverridden"] = caller.ruleOverridden;
                params["overrideComments"] = caller.overrideComments;
                params["overrideRuleResults"] = JSON.stringify(caller.overrideRuleResults);
             }

             U.call("/bp/mod/bp/record/terminate", params, function(response) {
                // console.log("action: " + action + ", status: " + response.status);
					U.CloseShowWaiting();
	                if (response.status.toLocaleLowerCase() === "success") {
	                    U.Notification(U.translateMessage("record_suc_terminated", recordInfo.config.context.bpName, PPP.data.upper.record_no),
	                    function(){window.close();	window.opener.submit_search();});
	                }
	                else {
	                    if (response.rule_error) {
	                        //handle ruleexception dialog
	                        U.loadDefer("#rule-exception-div-defer").then(function(){
							oj.Context.getContext($("#rule-exception-div")[0]).getBusyContext().whenReady().then(function(){
	                        	$("#rule-exception-div")[0].showDialog(response.ruleinfo);
	                        })
	                        })
	                    }
	                    else if(response.fund_error) {
	                    	U.loadDefer("#fund-exception-div-defer").then(function(){
							oj.Context.getContext($("#fund-exception-div")[0]).getBusyContext().whenReady().then(function(){
                            	$("#fund-exception-div")[0].showDialog(response.fundinfo);
                            })
	                        })
                        }
	                    else {
	                        U.Alert(response.error);
	                    }
	                }
             });
         };
         if (caller && caller.type === 'ruleerror') {
            cb(true);
         }
         else {
            U.ConfirmByKey("terminate_record_confirm",  recordInfo.config.context.bpName, PPP.data.upper.record_no, cb);
         }
	}

	self.transferOwnership = function(){
		var upper = PPP.data.upper;
		var context = recordInfo.config.context;
		var isNWF = self.no_workflow;
		window.isTopWindow = true;
		U.loadDefer("#loadBpTransferOwnership").then(function() {
			setTimeout(function() {
				var bpRecordTransferOwnership = ko.dataFor(document.getElementById("bpRecordTransferOwnership"));
			  	bpRecordTransferOwnership.loadConfiguration({id:PPP.data.upper.id, creatorId: PPP.data.upper.k__creator_id, oldOwner:PPP.data.upper.creator_id, record_no:PPP.data.upper.record_no, context:context,parent:self});
			}, 100);  
		});
	}
	
	self.getResource = function() {
		return self.resource; //"to":{"groups":[{"role_type":3,"id":72,"name":"Project Administrators","firstname":"Sopi John","lastname":"","companyname":"","email":""}],"users":[{"role_type":1,"id":1028,"name":"Anto's my name John","firstname":"Anto's my name","lastname":"John","companyname":"Lease Company","email":"anto.john@oracle.com"}]}
	}

	self.showpaymentmsg = function(){
		// return self.paymentalertmsg;
	}
	
	self.setResource = function(res) {
		self.resource = res;
	}
	self.setValidationForm =  function(form,errorFrom){
		if(errorFrom == "lineitem"){
			self.btnDelAllLines(false);
			self.serverErrors = [];
        }
		self.errorFrom = errorFrom;
		self.validateForm = form;
		if(self.spec.studio.type == "lease"){
            self.validateForm.extend().studio = self.spec.studio.type;
        }
	}

	self.displayErrorList = function(){
		if (!errorgridConfig) {
			var errorgridColumns = ["errortype", "errorlocation", "description"];
			errorgridConfig = new U.GridConfig({});
			errorgridConfig.addFields(errogridFields);
			errorgridConfig.setColumns();
			errorgridConfig.setToggleColumns(errorgridColumns);
			errorgridConfig.setColumnGroup(errorgridColumns);

			errorgridConfig.json.contextMenu().enabled = false;
			errorgridConfig.json.search().columnFilter = false;
			errorgridConfig.json.layout().autoResize = true;
			errorgridConfig.json.layout().autoResizeImmediate = true;

			errorgridConfig.json.layout().width = '100%';
			errorgridConfig.json.layout().height = 200 + "px";
		}
		U.loadDefer("#errorlist-popup-defer").then(function() {
			self.getErrorControl();
			self._displayErrorList();
		});
	}

	self._displayErrorList = function(){
		var erroListPopup =  $('#errorlist-popop');
		var $widget = erroListPopup.ojPopup( "widget" );
        $widget.css('top', $widget.position().top + 10);
        $widget.find('.oj-popup-tail').remove();
        $widget.append('<div class="oj-popup-tail oj-popup-tail-simple oj-center oj-top" role="presentation" id="errorlist-popop_tail" style="left: 66%;"></div>');
        errorListViewGrid = errorgridConfig.createWidget($('#errorlistgrid'));
		errorgridConfig.initCustomAction(errorListViewGrid);
		errorListViewGrid.grid('setStore',{});
		errorListViewGrid.grid('setStore',self.erroritems);
		erroListPopup.ojPopup('open','#errorlist-popop-btn',null);
		errorListViewGrid.grid("resize");
	}

	self.getErrorControl = function(preventShow){
		if (errorListViewGrid) {
			errorListViewGrid.grid('setStore',{});
		}
		var errors;
		var errorControl;
	    if (self.serverErrors.length > 0) {
	    	errors = self.serverErrors;
	    }
	    else {
	    	errorControl = self.validateForm.extend().validateData();
            if(recordInfo.config.context.rec_id == 0 && self.spec.studio.source === "/manager/record"){
            	self.validateCMxFormula(errorControl);
            }
	    	errors = errorControl.errors;
	    }

		if(errors.length > 0){
		    if (!preventShow) {
			    self.btnError(true);
			}
			self.errorCount(errors.length);
		}else{
			self.btnError(false);
			self.errorCount(0);
			return;
		}
		
		self.erroritems = [];
		if(errors.length > 0){
			for (var i=0; i<errors.length;) {
				var errorObj = errors[i];
				var item = {};
				item.errortype = "error";
				if(self.serverErrors.length > 0) {
					item.description = errorObj[1];
					item.errorlocation = errorObj[0];
				}
				else {
					if(self.errorFrom == "upper")
						item.errorlocation = self.spec.upper.label;//upper form tab name
					else
						item.errorlocation = self.detailInfo[self.currentTabId].tab_name;

				    item.description = errorObj[1];
			    }
				item.id = ++i;
				self.erroritems.push(item);
			}
			self.errorCount(errors.length);
			return errorControl;
		}
	}

	self.viewOnDrawingLevel = function(){
		var srcid = PPP.data.upper.id;
		var model = PPP.spec.upper.prefix;
		if (srcid == 0) {
			U.AlertByKey("no_file_in_lineitem")
			return;
		}
		U.call("/bp/space/download/file/check", {
			ids    : srcid,
			__uref : U.uref
		},
		function(response) {
			if (response.retList != null && typeof(response.retList) != 'undefined') {
				var row = response.retList;
				if (row == 0) {
					U.AlertByKey("no_drawing_files_display");
					return;
				} else {

					if (srcid != 0) {
						U.call("/bp/mod/dm/doc/file/virusscanstatus", {ids:srcid , file_type : 'space'},
                          function( data ) {
                          	if( data.uuu_content_status == 1 || data.uuu_content_status == 2 ){
                          		var key = 'virus_scanner_threat_alert_msg';
                          		var fileName = '';
                          		if( data.uuu_content_status == 1 ) {
                          			key = 'virus_scan_pending_alert_msg_no_display';
			    					fileName = data.pending_files[0];
                            	}
                            	else{
                            		fileName = data.virus_affected_files[0];
                            	}
                                    			
                            	U.AlertByKey( key, fileName );
                            	return;
                            }
                            else {
								var action = "/bp/space/drawing/view?model=" + model + "&id=" + srcid + "&from=level";
								oPicker = window.open(action, "UserPicker", "resizable=no,status=no,menubar=no,left=" + (screen.width - 1000) / 2 + ",top=" + (screen.height - 650) / 2 + ",height=650,width=1000");
								oPicker.focus();
							}
						  }
						);
					}

				}
			}
		}
		);
	};
	self.viewSpaces = function(){
		var srcid = PPP.data.upper.id;
		var key = PPP.data.upper.id;
		var url = '/bp/mod/bp/picker/is_level_associated_with_space';
		var levelName = PPP.data.upper.uuu_sp_level_name;
		var projectId=PPP.data.upper.project_id;
		design = {
				"ref_name": "space_sp_space_name",
				"bp_subtype": null,
				"prefix": "uai",
				"isCompanyBP": false,
				"isSuperProject": false,
				"label": "Space Picker",
				"source": "simple",
				"dd_name": "Space Picker",
				"pageid": "page.main.form.3",
				"type": "picker",
				"data_source": "space",
				"ref_label": "Space Name",
				"typeAhead": true,
				"studio_prefix": "uai",
				"studio_name": null,
				"level_no": key,
				"levelName": levelName,
				"isViewForm": true,
				"name": "uuu_phy_space_picker",
				"block": "b0",
				"projectId":projectId

		};
		U.call(url, {srcid: srcid},
				function(result) {
			if(result.result==false)
			{
				return U.AlertByKey(U.translateMessage("no_spaces_associated_with_this_level",levelName));
				
			}
			else
			{
				U.call('/bp/mod/bp/picker/log/' + design.data_source, design,
						function(result) {
					configuration = result;
					// resolve(result);
					self.openPickerDialog(configuration);
				},
				function(error) {
					reject("Picker_Dialog_Not_Opening");
				});
			}

		}
		)
	};
	self.openPickerDialog = function(configuration) {
		U.getDeferModule("picker-defer","unifier-module-picker-dialog").then(function(pickerDialog) {
			pickerDialog.loadConfiguration({
				P: configuration,
				parent: self,
				design: design
			});
			if ($("#unifier-module-inviteBids-dialog_layer").hasClass('oj-focus-within')) {
				$("#unifier-module-inviteBids-dialog_layer").removeClass('oj-focus-within');
				$("#unifier-module-picker-dialog_layer").addClass('oj-focus-within');
			}
		});
	};
	self.importDrawingFile = function() {
		var da=self.spec.studio.source;
		var filepicker1 = new FilePickerControl("filepicker1", top);
		UResetSubmit();
		filepicker1.setContentSource("6");
		filepicker1.setUpload_type("space");
		filepicker1.setFile_type("space");
		filepicker1.setFilter("*.dwg,*.unf,*.dwf");
		filepicker1.setSingle("no");
		filepicker1.setProject_id(PPP.data.upper.project_id);
		uploadFile = filepicker1.openLocal();
	};
	self.errorlistOpenHandler = function(){
		//alert('inside errorlist open..');
	}

	self.errorlistCloseHandler = function(){
		//alert('inside errorlist Close..');
	}

	self.beforeCloseerrorlist = function(){
		//alert('before errorlist close..');
	}

	self.undoAcceptTask = function() {
		var wf = PPP.data.workflow;
		var context = recordInfo.config.context;
		U.ShowWaiting();
		U.call("/bp/mod/wf/tasks/unaccept/" + wf.task_id,null,function(response){
			U.CloseShowWaiting();
            if(typeof(PPP.qbt_id) != "undefined" && PPP.from_qbt == 1) {
                    window.opener.refreshQbtTab(PPP.qbt_id);
            } else {
				window.opener.submit_search();
			}
			U.replaceLocation("/bp/mod/bp/record/opentask/" + wf.task_id);
			$("#record-container").html(U.getProcessingDotsHTML());
		},false,function(response){
			U.CloseShowWaiting();
			U.Alert(response.error_message ? response.error_message : response.message);
		});
	}

	self.declineTask = function() {
		var wf = PPP.data.workflow;

		if (!wf.istep && !wf.currentStep.decline_ok)
		{
			U.AlertByKey("no_permission_alert");
			return;
		}

		var cb = function(){
			window.opener.submit_search();
			window.close();
		}

		U.ConfirmByKey("warn_before_decline", function(y){
			if(!y)
				return;
			U.ShowWaiting();
			U.call('/bp/mod/bp/record/decline/' + wf.task_id, {},
				function(response) {
					// console.log(JSON.stringify(response));
					U.CloseShowWaiting();
					if(response.error_code === 1){
						U.AlertByKey("studio_workflow_no_task_data");
					}else{
						U.Alert(response.error_message, cb);
					}
				}
			);
		});
	}

	self.triggerUserGroupPicker = function(type) {
		U.loadDefer("#assigneeDetailDefer").then(function() {
			self._triggerUserGroupPicker(type);
		});
	}

	self._triggerUserGroupPicker = function(type) {
		var wf = PPP.data.workflow;
		var context = recordInfo.config.context;

		var assigneeDetail = document.getElementById("assigneeDetail");
		if(type === "assignee") {                                    
			assigneeDetail.getField("addAssigneeCC").extend().setResource(wf.add_to);
            var resource = assigneeDetail.getField("addAssigneeCC").extend().getResource();
            resource.assigneeFilter = 0;
            resource.ccFilter = 0;
            resource.role = 10;
            resource.sourceId = wf.currentStep.id;            
        }
		else {
			//Append CC users and groups as well
			if (wf.ace_cc && wf.ace_cc.users) {
				_.each(wf.ace_cc.users, function(r) {
					wf.add_cc.users.push(r);
				});
			}
			if (wf.ace_cc && wf.ace_cc.groups) {
				_.each(wf.ace_cc.groups, function(r) {
					wf.add_cc.groups.push(r);
				});
            }            
			assigneeDetail.getField("addAssigneeCC").extend().setResource(wf.add_cc);
            var resource = assigneeDetail.getField("addAssigneeCC").extend().getResource();
			resource.sourceId = wf.currentStep.id;  
            resource.role = 220;
            resource.assigneeFilter = 0;
			resource.ccFilter = wf.currentStep.ccFilter;
		}
		assigneeDetail.getField("addAssigneeCC").extend().updateEventHandler();
		
		assigneeDetail.addEventListener("user-group-change", function(event) {

			var assignees = assigneeDetail.getValue("addAssigneeCC");
			// console.log("The assignees list ====> " + JSON.stringify(assignees));
			var users = [];
			var groups = [];
			if (assignees && assignees.users) {
				_.each(assignees.users, function(r) {
					users.push(r.id);
				});
			}
			if (assignees && assignees.groups) {
				_.each(assignees.groups, function(r) {
					groups.push(r.id);
				});
			}

			var data = {
				type : type,
				process_id : wf.process_id,
				task_id : wf.task_id,
				user_ids : users.join(","),
				group_ids : groups.join(",")
			}

			var cb = function(){
				var srcUrl = "/bp/mod/bp/record/open/" + context.prefix + "/" + context.rec_id;
						srcUrl += "?project_id=" + context.pid;
				U.replaceLocation(srcUrl);
			}

			U.ShowWaiting();
			U.call("/bp/mod/bp/record/addAssigneeCc",{ data : JSON.stringify(data) },
				function(response) {
				//	console.log(JSON.stringify(response));
					U.CloseShowWaiting();
					if(response.error_code === 1){
						U.AlertByKey("studio_workflow_no_task_data");
					}else if(response.error_code === 2){
						U.Alert(response.error_message);
					}
					else{
						U.Alert(response.error_message, cb);
					}
			});				
		});
	}

	self.addAssignee = function() {
		var wf = PPP.data.workflow;
		// console.log("wf ====> " + JSON.stringify(wf));

		if (!wf.currentStep.add_user_ok)
		{
			U.AlertByKey("no_right_to_add_assignees_alert");
			return;
		}

		self.triggerUserGroupPicker("assignee");
	}

	self.addCc = function() {
		var wf = PPP.data.workflow;
		// console.log("wf ====> " + JSON.stringify(wf));

		if (!wf.currentStep.add_cc_ok)
		{
			U.AlertByKey("no_right_to_copy_users_alert");
			return;
		}

		self.triggerUserGroupPicker("cc");
	}

	self.sendMail = function() {
		U.loadDefer("#loadMailDialog").then(function() {
			if (!self.mailDom) {
				var mailUiInitializerData = {};
				mailUiInitializerData.launcher = "bp_record";
				mailUiInitializerData.mailFlagTypes = loadMailFlagTypes();
				mailUiInitializerData.vendorId = PPP.vendorId;
				mailUiInitializerData.type = "bp_record";

				self.mailDom = $("#mailDivContainer").get(0);
				new Promise(function(resolve, reject) {
					ko.applyBindingsToNode(self.mailDom, {
						ojModule: {
							name: 'mail/mail',
							params: {
								resolver: resolve,
								mailUiInitializerData: mailUiInitializerData
							}
						}
					});
				}).then(function() {
					doSendMail();
				});
			} else {
				doSendMail();
			}
		});
	};

	function doSendMail() {
        // This method is equivalent of Send_uMail() method, defined in
        // panel_non_workflow_js.vm and panel_workflow_js.vm; case format==3
        recordAttachCount = recordAttachCount + 1;
        var winName = "BPRecordAttach"+recordAttachCount;
        var params = {
            size: 1000000,
            page: 1,
            id: PPP.data.upper.id,
            srcid: PPP.data.upper.id,
            model: self.spec.upper.prefix,
            title: PPP.data.upper.record_no,
            source: self.spec.studio.source,
            isworkflow: !self.spec.studio.no_workflow,
            all_tab_ids: 0,
            project_id: PPP.data.upper.project_id,
            windowName: winName
        };

        if (PPP.vendorId != 0) {
            params.a = "form.bid.0";
            params.b = self.spec.upper.prefix;
        } else {
            params.a = PPP.config.context.formid;        	
            params.b = self.spec.upper.prefix;
        }

        var randomKey = "_a" + Math.round(100*Math.random());
        var randomValue = Math.round(10000*Math.random());
        params[randomKey] = randomValue;

        params.dummys = "a.pdf";

        params.U = true;
        params.DL = true;
        params.fromUmail = 1;
        params.printable = 1;

        params.attach_count = 1;
        params.link_count = 0;
        params.mail_count = 0;

        params.form_type = self.spec.studio.source;

        U.call("/bp/mod/mail/print_bp_for_attachment", params, function (result) {
            if (result.status == "success") {
				$('#mailDialog').ojDialog('open');
				var attachmentDetails = result.attachmentDetails;
				var eventData = {
					launcher: "bp_record",
					type: "bp_record",
					mailState: 1,
					mailId: 0,
					projectId: PPP.data.upper.project_id,
					umail_from_bp: attachmentDetails.umail_from_bp,
					file_id: attachmentDetails.file_id,
					file_list: attachmentDetails.file_list,
					title: attachmentDetails.title,
					windowName: winName,
					recordInfo: recordInfo
				};
				U.Event.publish('mail_open', eventData);
	        }
        }, false, function (err) {
            console.log("Error loading general tab: " + err);
        });
    }

	self.toggleRightTabs = function(data, event){
		var splitContainer = $(event.currentTarget).parents(".split-pane-container");
		var splitSize = splitContainer.splitPane('option','firstSplitSize');
		var tabId = self.currentTabId == "" ? "-1" : self.currentTabId;
		if (splitSize > 0.1) {
			recordInfo['tabDetailsMaximized'][tabId] = true;
			splitContainer.attr("previousSplitSize",splitSize);
			splitContainer.splitPane('setSplit',0.0);
			$("#bp-record-button-expand").ojButton( "option", "icons.start", "pgbu-icon icon-minimize" );
			self.expandBtnLabel(U.translate("Restore"));
		}
		else {
			recordInfo['tabDetailsMaximized'][tabId] = false;
			var pss = parseFloat(splitContainer.attr("previousSplitSize"));
			if (!isNaN(pss)) {
				splitContainer.splitPane('setSplit', pss);
			}
			$("#bp-record-button-expand").ojButton( "option", "icons.start", "pgbu-icon icon-expand2" );
			// $("#id-button-expand").ojButton( "option", "icons.start", "pgbu-icon icon-expand2" );
			self.expandBtnLabel(U.translate("Maximize"));
		}

		$('#tabUpper-tabs').ojTabs("refresh");
	}


	self.DetailPrint = function(format,isBulkPrint) {
		U.loadDefer("#loadPrintOptions").then(function() {
			self._DetailPrint(format,isBulkPrint);
		});
	}
	
	var optionsWin;
	self._DetailPrint = function(){
		console.log("Inside DetailPrint");
		if(optionsWin) optionsWin.close();

		self.closesaveDraftDialog();

		var hiddenOrderByForTabs = "";
		var hiddenOrderForTabs = "";
		_.each(self.detailInfo, function(detail){
			var detailObj = self.detailInfo[detail.tabId];
			if(detailObj && detailObj.ulog && detailObj.ulog.getGrid().sortby != undefined){
				var orderBy = detailObj.ulog.getGrid().sortby[0].dataIndex;
				var order = detailObj.ulog.getGrid().sortby[0].order;

				if(detail.tabId == "0"){
					hiddenOrderByForTabs += "&hiddenOrderBy" + "=" + orderBy;
					hiddenOrderForTabs += "&hiddenOrder" + "=" + (order == "dsc" ? "desc" : order);
				}else{
					hiddenOrderByForTabs += "&hiddenOrderBy" + detail.tabId + "=" + orderBy;
					hiddenOrderForTabs += "&hiddenOrder" + detail.tabId + "=" + (order == "dsc" ? "desc" : order);
				}	
			}
		});

		console.log("Inside DetailPrint of record.js");
		console.log(PPP);
		self.printoption.getSelectedItemLength = 1;
		self.printoption.P.servletPath = "/bp";
		self.printoption.P.currencyId = 0; //initialize to 0;

		if(PPP.spec.studio.source === 'cost') {
			//set the currency from the bean first
			var cData = upperform.extend().getCurrentData();
			if(cData.k__currencyid) {
				self.printoption.P.currencyId = cData.k__currencyid;
			}
			else {
				self.printoption.P.currencyId = PPP.data.upper.k__currencyid;
			}
		}
		if(recordInfo.config.context.iscompanyBp){
				self.printoption.P.currencyId = recordInfo.config.context.b_currencyid;
		}

		self.printoption.P.projectId = PPP.data.upper.project_id;
		self.printoption.P.model = 	recordInfo.config.context.prefix;
		self.printoption.P.userId = recordInfo.config.context.curruserid;
		self.printoption.P.hiddenOrderByForTabs = hiddenOrderByForTabs;
		self.printoption.P.hiddenOrderForTabs = hiddenOrderForTabs;

		if(PPP.config.context.fromdraftlog == "1" || (recordInfo.config.context.rec_id == 0 && recordInfo.config.context.task_id > 0)){
			self.printoption.P.isDraftLog = true;
			self.printoption.P.isBplog = false;
		}else{
			self.printoption.P.isBplog = true;
			self.printoption.P.isDraftLog = false;
		}
		//self.printoption.P = P_temp;
		var selectedItems = new Array();

		if(recordInfo.config.context.no_workflow) {
		selectedItems[0] = new Object({
			creator_id : PPP.data.upper.creator_id,
			id : recordInfo.config.context.rec_id,
			pk_record_no : PPP.data.upper.record_no,
			wf_status : self.no_workflow,
			modelname : recordInfo.config.context.prefix,
			project_id : PPP.data.upper.project_id,
			form_id : recordInfo.config.context.formid
		});
		}else {
			selectedItems[0] = new Object({
				creator_id : PPP.data.upper.creator_id,
				id : recordInfo.config.context.rec_id,
				pk_record_no : PPP.data.upper.record_no,
				wf_status : self.no_workflow,
				modelname : recordInfo.config.context.prefix,
				project_id : PPP.data.upper.project_id,
				taskId: recordInfo.config.context.task_id,
				form_id : recordInfo.config.context.formid
			});
		}

		// console.log(selectedItems);
		self.printoption.doPrint(selectedItems,self.format(),self.isBulkPrint());
	};
	
	
		self.CustomHelp = function () {
			U.call("/bp/mod/dm/doc/file/virusscanstatus", 
				{ help_file_4_model:recordInfo.config.context.prefix ,
				  projectId : recordInfo.config.context.pid },
                function( data ) {
                    if( data.uuu_content_status == 1 ){
						var key = 'many_files_virus_scan_pending_alert_msg';
						var fileName = ''; 
			    		if( data.pending_files.length == 1  ) {
			    			key = 'virus_scan_pending_alert_msg';
			    			fileName = data.pending_files[0];
			    		}
				
						U.ConfirmByKey( key , fileName,
							function ( y) {
								if( y ) {
									self.CustomHelpDownload();
								}
							}
						);
				
					}
					else if( data.uuu_content_status == 2 ){
						var key = 'many_files_virus_scanner_threat_alert_msg';
						var fileName = '';
			    		if( data.virus_affected_files.length == 1  ) {
			    			key = 'virus_scanner_threat_alert_msg';
			    			fileName = data.virus_affected_files[0];
			    		}
			    	
						U.AlertByKey( key, fileName );
					}
                    else {
						self.CustomHelpDownload();
					}
				}
			);
		}

        self.CustomHelpDownload = function () {
            var rand ="?_a"+Math.round(100*Math.random())+"="+Math.round(10000*Math.random())
            var url="/bp/studio/bp/get-data-for-bphelp"+rand;
            //?from=log&projectId="+P.projectId+"&model="+P.model+rand;
            //var viewfile = window.open(url,"abcd","resizable=yes,status=yes,toolbar=no,menubar=no,scrollbars=yes,left="+(screen.width-750)/2+",top="+(screen.height-600)/2+",height=600,width=750");
            var height=600,width=750,l=(screen.width-750)/2,t=(screen.height-600)/2

            U.call(url,
                   {
                        fromOjetlog: 1,
                        projectId: recordInfo.config.context.pid,
                        model: recordInfo.config.context.prefix
                   },
                   //{packageLoaded:${a(packageLoaded)},inModules:${a(inModules)},helpFileId:${a(bp_setup).help_file_id}}"/>
                   function(response) {
                        if(response.helpFileId == 0) {
                            if(response.packageLoaded ==='yes' && response.inModules === 'yes') {
                                var fileURL = response.otnLink+"/bp/"+recordInfo.config.context.prefix+"/index.htm"; // no navbean reference
                                //top.openNamedChildWindow(fileURL, "helpFileWin", height, width, t, l);
                                var helpWindow = window.open(fileURL,"helpFileWin","resizable=yes,scrollbars=yes,statusbars=yes,menubars=no,addressbars=no,left=" + (screen.width - 750) / 2 + ",top=" + (screen.height - 600) / 2 + ",height=600,width=750");
                            }
                            else {
                                U.AlertByKey("help_file_not_configured");
                            }
                        }
                        else { // file id exists
                        	var helpWindow = window.open("/bp/studio/bp/native_view_help_file?fromOjetlog=1&help_file_id="+response.helpFileId,"helpFileWin","resizable=yes,scrollbars=yes,statusbars=yes,menubars=no,addressbars=no,left=" + (screen.width - 750) / 2 + ",top=" + (screen.height - 600) / 2 + ",height=600,width=750");
                        }

                   }
            );
        }

        self.openUpkWindow = function() {
			IasSetContext({key: recordInfo.config.context.prefix, mode: 'user'});
			IasOpenGateway();
        };

     	self.print = function(format) {
     		if(optionsWin) optionsWin.close();

			self.isBulkPrint(false);

     		if(format == "printHTML"){
     			self.format(2);
     			self.printHTMLOrPDF();
     		}else if(format == "printPDF"){
     			self.format(1);
     			self.printHTMLOrPDF();
     		}else{
     			self.format(3);
     			self.customPrint();
     		}
     	};

     	self.printHTMLOrPDF = function(){
     		var readonly = recordInfo.config.context.readonly;
			console.log("Inside printHTMLOrPDF");
			console.log(upperform.extend().updatedValues);

			if(readonly){
				 self.DetailPrint();
			}else{
				U.loadDefer("#loadSaveDraftDialog").then(function(){
					self.openSaveDraftDialog("saveDraftDialog", 400, 170);
				})
			}
     	};

     	self.saveBeforePrint = function(){
			self.silentSave().then(function(response){
				if(response.errors.length > 0) {
					self.closesaveDraftDialog();
		           return;
		        }else {
		        	if(self.format() == 3){
		        		self.closesaveDraftDialog();
		        		self._customPrint();
		        	}
		        	else{
			        	if(!recordInfo.config.context.no_workflow) {
			        		recordInfo.config.context.task_id = response.draft.taskId;
			        	}
			            self.DetailPrint();
			        }
		        }
			});
		 };
		 
		self.customPrint = function() {
			U.loadDefer("#loadCustomPrintDialog").then(function() {
				self._customPrint();
			});
		}

     	self._customPrint = function() {
            var recordId = recordInfo.config.context.rec_id;
            if (recordId == 0 && recordInfo.config.context.no_workflow){
            	U.loadDefer("#loadSaveDraftDialog").then(function(){
					self.openSaveDraftDialog("saveDraftDialog", 400, 170);
				})
            	return;
			}

			var projectId = PPP.data.upper.project_id;
            var userId = recordInfo.config.context.curruserid;
			var model = recordInfo.config.context.prefix;

			var printResult = null;
			U.call("/bp/studio/workflow/params_for_Bp_log_print", {isBpLog:"yes", projectId:projectId, userId:userId, source_id:recordId, model:model}, function(result) {
				if (result === "") {
					return;
				}
				printResult = result;
			}, true);

			var recordNo = PPP.data.upper.record_no;
			var source = self.spec.studio.source;
			var subType = recordInfo.config.context.lineSubType;
			var taskId = printResult.print_task_id;
			var processId = printResult.process_id;
			var formId = printResult.currentFormId;
			var isWorkflow = !self.no_workflow;

			self.customPrintView.doCustomPrint(projectId, source, subType, model, recordNo, recordId, taskId, processId, formId, isWorkflow, false, true);
		};
		U.Event.subscribe('attach_custom_print',function(data){
			if(data!=null){
			self.attachCustomprint(data);
			}
		});
		self.attachCustomprint=function(data){
			U.loadDefer("#loadCustomPrintDialog").then(function() {
				self.customPrintView.doCustomPrintAttach(data);
			});
		};
		self.sendForSign = function(){
			 var ids = ko.dataFor(document.getElementById("EsignatureDialog"));
	         ids.setCalledFrom ('bp');
	         ids.setRecordId(PPP.config.context.rec_id);
	         ids.setBPModel(PPP.config.context.prefix);
	         ids.setTaskId(PPP.data.workflow.task_id);
	         var k;
	         ids.open();
 		}
     	self.openSaveDraftDialog = function(dialogID, width, height){
     		var dialog = $("#" + dialogID);
     		var left = ($(window).width() - width)/2;
            var top = ($(window).height() - height)/2;
     		dialog.ojDialog("widget").css({"left":left, "top": top});
			dialog.ojDialog("widget").css("height", height);
			dialog.ojDialog("widget").css("width", width);
			dialog.ojDialog("open");
     	};

     	self.closesaveDraftDialog = function(){
     		if ($("#saveDraftDialog")[0])
            	$("#saveDraftDialog").ojDialog("close");
        };
        self.exportLineItemTemplate = function () {
           //var isCost = (P.studioSource === "cost" ? "cost_ds" : "");
    	   var context = recordInfo.config.context;
    	   var refIdParam = "";
    	   if(PPP.spec.studio.type == "spend" || PPP.spec.studio.type == "payment") {
    	        refIdParam = "&refid="+recordInfo.upperform.getField("refid").getValue();
    	   }
           var action = "/bp/webservice/bp/csv/getCSVInterface?bpname=" + encodeURIComponent(context.bpName) +
                        "&bpmodelname=" + context.prefix+"&isdetail=true"+"&tabid=0"+refIdParam;
          
           if(PPP.spec.studio.type == "payment" && recordInfo.config.map_reference_psov != undefined
        		   && recordInfo.config.map_reference_psov[recordInfo.config.context.prefix] != undefined
        		   && recordInfo.upperform.getField("refid").getValue() > 0){
        	   action += "&model="+recordInfo.config.context.prefix+"&fromOJET=true";
        	   if(recordInfo.config.context.task_id != undefined){
        		   action += "&task_id="+recordInfo.config.context.task_id;
        	   } else {
        		   action += "&task_id=0";
        	   }
           } 
    	   var fm = document.attachmentform;
    	   if(fm[0].action != undefined){
    		   fm[0].action = action;
        	   U.Submit(fm[0], false);
    	   } else {
    		   fm.action = action;
        	   U.Submit(fm, false);
    	   }
    	   U.ResetSubmit();
                   
        };

		self.closeSStepDialog = function(){
            $("#autoCreateSStep").ojDialog("close");
			clickSStep = true;
			self.sendData();
        };

        self.overrideRuleException = function(event) {
            $("#rule-exception-div")[0].closeRuleExceptionDialog();

            if(event.detail.rules.checkoverride === 'terminate') {
                self.terminateRecord(event.detail.rules);
            }
            else {
                ruleOverrideResubmit = true;
                self.payload.rules = event.detail.rules;
                self.submitRecordData();
            }
        };

		self.setAutoCreateList = function() {

			var ugrid = $("#sstep-grid")[0].extend();
			var items = ugrid.getSelectedItems();
			//alert(JSON.stringify(items));
			autoCreateList = [];
			_.each(items, function(r) {
				autoCreateList.push(r.key);
			});

			$("#autoCreateSStep").ojDialog("close");
			clickSStep = true;
			self.sendData();
		}
		var getReviewerParameters = function(){
			var viewonly = 0;
			//need to add || $read_only_action_form == "1"
			if (PPP.disableViewonly || recordInfo.config.context.readonly || - PPP.data.upper.status == "Terminated")
				viewonly=1;

			var notask=0;
			if(self.no_workflow || (self.spec.studio.source == "text" && recordInfo.config.context.isRecordEditor == true))
				notask=1;

			detail_design_exists = true;
			/*
			#if( ($form_type == "document" && !$antLineItem) || ($form_type =="cost" && ($web.getReference("map_reference_s_psov").get($model) || $web.getReference("map_create_s_psov").get($model))) )
				#set($detail_design_exists = "false")
			#end
			*/
			var taskID = -1;
			if(PPP.data.workflow && recordInfo.config.context.rec_id != 0) {
				taskID = PPP.data.workflow.task_id;
			}
			var formid = recordInfo.config.context.formid;
			//if(self.no_workflow)
			//	formid = "";
			var params = {
				model: recordInfo.config.context.prefix, 
				form_id: formid, 
				record_id: recordInfo.config.context.rec_id, 
				task_id: taskID, 
				detail_design_exists: detail_design_exists,
				view_only:viewonly,
				hide_comments:recordInfo.comments.hide_comments,
				delete_comments:recordInfo.comments.delete_comments,
				permission_comments:recordInfo.comments.cc_add_allowed,
				formid:formid,
				notask:notask,
				form_type:self.spec.studio.source,
				finalCommentOK:recordInfo.config.context.finalCommentOK,
				isOjet:true
			};
			// return params;

			var vonly;
			if(viewonly == 1)
				vonly = true;
			else
				vonly = false;
			// New autovue window
			var cparam = 
            {
                source_type: "BP",
                file_id: 0,
                file_name: 0,
                model: recordInfo.config.context.prefix,
                recordId: recordInfo.config.context.rec_id, 
                sessionBean: self.sessionBeanId(),
                form_id: formid, 
                isNonWorkFlow: self.no_workflow,
                readOnly: vonly,
                studioSource: self.spec.studio.source,
                sub_type: "AV",
                internalServerEnabled: recordInfo.attachments.internalServerEnabled,
				registryprefix: recordInfo.attachments.registryprefix,
				project_id: recordInfo.config.context.pid,
				user_id: recordInfo.config.context.curruserid
            }

            if(taskID != undefined) 
                cparam.task_id = taskID;
            else
                cparam.task_id = recordInfo.config.context.task_id;

            if(self.spec.studio.source == "document") // Don't know
            {
                cparam.docTypeAddComments = false;
                if(self.spec.form.bp_tab["0"].params.add_comments == "1")
                {
                    cparam.docTypeAddComments = true;
                }

                if(self.spec.form.bp_tab["0"].params.add_final_comments == "1")
                    cparam.docTypeAllowFinalComments = true;
                else
                    cparam.docTypeAllowFinalComments = false;
            }

            // cparam.isProxy=self.isProxy();
            // cparam.sign_agent=self.recordInfo.attachments.sign_agent;
            // cparam.is_esign_enabled=self.recordInfo.attachments.is_esign_enabled;

            return cparam;
		}

		var getReviewerParametersOUI = function(){
			var viewonly = 0;
			if (PPP.disableViewonly || recordInfo.config.context.readonly || - PPP.data.upper.status == "Terminated")
				viewonly=1;

			var notask=0;
			if(self.no_workflow || (self.spec.studio.source == "text" && recordInfo.config.context.isRecordEditor == true))
				notask=1;

			detail_design_exists = true;

			var formid = recordInfo.config.context.formid;
			//if(self.no_workflow)
			//	formid = "";

			var vonly;
			if(viewonly == 1)
				vonly = true;
			else
				vonly = false;
			
			var cparam = 
            {
                source_type: "BP",
                file_id: 0,
                file_name: 0,
                model: recordInfo.config.context.prefix,
                recordId: recordInfo.config.context.rec_id, 
                sessionBean: self.sessionBeanId(),
                form_id: formid, 
                isNonWorkFlow: self.no_workflow,
                readOnly: vonly,
                studioSource: self.spec.studio.source,
                internalServerEnabled: recordInfo.attachments.internalServerEnabled,
				registryprefix: recordInfo.attachments.registryprefix,
				project_id: recordInfo.config.context.pid,
				user_id: recordInfo.config.context.curruserid
            }

            var task_id = -1;
			if(PPP.data.workflow && recordInfo.config.context.rec_id != 0) {
				cparam.task_id = PPP.data.workflow.task_id;
			}
			else if(recordInfo.config.context.task_id > -1) 
                cparam.task_id = recordInfo.config.context.task_id;
            else
            	cparam.task_id = task_id;

            if(self.spec.studio.source == "document") // Don't know
            {
                cparam.docTypeAddComments = false;
                if(self.spec.form.bp_tab["0"].params.add_comments == "1")
                {
                    cparam.docTypeAddComments = true;
                }

                if(self.spec.form.bp_tab["0"].params.add_final_comments == "1")
                    cparam.docTypeAllowFinalComments = true;
                else
                    cparam.docTypeAllowFinalComments = false;
            }

            // cparam.isProxy=self.isProxy();
            // cparam.sign_agent=self.recordInfo.attachments.sign_agent;
            // cparam.is_esign_enabled=self.recordInfo.attachments.is_esign_enabled;

            return cparam;
		}

		window.getFormSpec = function ()
        {
            return recordInfo.spec.form;
        }

			
		self.reviewAttachments = function(reviewtype) {
			if(reviewtype == "oui")
				self.ouiAttachmentViewer();
			else if(reviewtype == "autovue")
				self.autoVueAttachmentViewer();
		}
		self.ouiAttachmentViewer = function(){
			var params =getReviewerParametersOUI();
			if(params.recordId <= 0 && params.task_id <= 0) {
				U.AlertByKey("no_attachments_review");
				return;
			}
			var doc_url = "/bp/rest/viewer/viewer_home/";
			var reviewChild = U.open(U.urefSearch(doc_url), {name:"uiViewer", w:1900, h:650},params);
     	};
		self.autoVueAttachmentViewer = function(){
			var params =getReviewerParameters();
			
			var doc_url = "/bp/rest/viewer/viewer_home/";
			if(params.recordId <= 0 && params.task_id <= 0) {
				U.AlertByKey("no_attachments_review");
				return;
			}
			
			var reviewChild = U.open(U.urefSearch(doc_url), {name:"uiViewer", w:1900, h:650},params);
     	};

       self.getWorkflowMenu = function(no_workflow,detail) {
             detail.qbtwfMenu();
             var wfMenu = [];
             detail.isMultiWF(parseInt(detail.wf_templates.length) > 1);
             detail.isSingleWF(parseInt(detail.wf_templates.length) === 1);
             for(var index = 0; index < detail.wf_templates.length; index++) {
                var name = detail.wf_templates[index].name;
                var wf_id = detail.wf_templates[index].id;
                //if(no_workflow)
                    //wf_id = 0;
                var menu = {text: U.translate(name), index : index, id: wf_id};
                console.log("www id: " + wf_id);
                menu["action"] = function() {
                                                var wfid = wf_id;
                                                return function(){
                                                    console.log("workflow id: " + wfid);
                                                    self.openNewProcessWrapper(wfid);
                                                }
                                       }();
                wfMenu.push(menu);
            }

            detail.qbtwfMenu(wfMenu);
            $("#create-qbtrecord-wf-Menu"+self.currentTabId).ojMenu("refresh");
        };

		self.handleShellLocationChange = function(){
			var shellTemplate = upperform.getField("uuu_shell_template_picker");
			console.log(self.detailInfo)

			if(shellTemplate) {
				var shellTemplateVal = shellTemplate.getValue();
				if(!shellTemplateVal || shellTemplateVal == 0) return;
				var context = recordInfo.config.context;
				var id = context.rec_id;
				var taskId = 0;
				if(!self.no_workflow && id == 0) {
					taskId = context.task_id;
					if(taskId == -1)
						taskId = 0;
				}
				var shellLocationVal = upperform.getValue("uuu_shell_location");
				if(!shellLocationVal || (_.isArray(shellLocationVal) && shellLocationVal.length == 0))
					shellLocationVal = 0;
				var params = {
					shell_location: shellLocationVal,
					shell_template: shellTemplateVal,
					id: id,
					task_id: taskId,
					model: context.prefix,
					isSuperProject: shellTemplate.design.isSuperProject,
					no_workflow: self.no_workflow
				}
				U.call("/bp/studio/bp/shell_template_picker/validate", params, function(response) {
					console.log("response: " + JSON.stringify(response));
					if(response.error && response.error == 1) {
						//alert("cleraring shell template value...");
						shellTemplate.extend().handleClear();

						if(shellTemplate.design.isSuperProject) {
							_.each(self.detailInfo, function(detail){
								var detailObj = self.detailInfo[detail.tabId];
								if(detailObj && detailObj.ulog)
									detailObj.ulog.invokeRefresh();
							});
						}
					}
				});
			}
		}

		self.handleShellTemplateChange = function(){
			var shellTemplate = upperform.getField("uuu_shell_template_picker");
			console.log(self.detailInfo)

			if(!shellTemplate.design.isSuperProject)
				return;

			var context = recordInfo.config.context;
			var id = context.rec_id;
			var taskId = 0;
			if(!self.no_workflow && id == 0) {
				taskId = context.task_id;
				if(taskId == -1)
					taskId = 0;
			}

			if(id == 0 && taskId == 0)
				return;

			var shellTemplateVal = shellTemplate.getValue();
			if(!shellTemplateVal)
				shellTemplateVal = 0;

			//alert("shell template picker value  : " + shellTemplateVal);
			var params = {
				shell_template: shellTemplateVal,
				id: id,
				task_id: taskId,
				model: context.prefix,
				no_workflow: self.no_workflow
			}
			U.call("/bp/studio/bp/shell_template_picker/validate/li", params, function(response) {
				console.log("response: " + JSON.stringify(response));
				if(response.error && response.error == 1) {
					_.each(self.detailInfo, function(detail){
						var detailObj = self.detailInfo[detail.tabId];
						if(detailObj && detailObj.ulog)
							detailObj.ulog.invokeRefresh();
					});
				}
			});

		}

		var loadViewWorkflow = function() {
			var wf = PPP.data.workflow;

			actionDetail = document.getElementById("actionDetail");
			actionDetail.getField("action").setOptions(wf.actions);
			self.showTaskDueDate(false);
			self.showTaskInfo(false);
			self.showDueDate(false);
			self.showCC(false);
			self.showTo(true);
			actionDetail.getField("action").setDisabled(true);
			actionDetail.getField("to").setDisabled(true);

			var template_wf_info = wf.template_wf_info;

			if(recordInfo.config.context.bpSendComplete)  {
				self.showSendButton(true);
				pickedLinkId = template_wf_info.picked_link_id;
				selectedWF.nextStep = {
					"id" : template_wf_info.next_step_id,
					"name" : template_wf_info.next_step_name
				}
				if(template_wf_info.auto_create_list) {
					autoCreateList = template_wf_info.auto_create_list.split(",");
				}
			}
			else
				self.showSendButton(false);

			actionDetail.setValue("step",template_wf_info.next_step_name);
			actionDetail.setValue("to", template_wf_info.to);
			actionDetail.getField("action").setValue(template_wf_info.picked_link_id);

			if((template_wf_info.cc.users && template_wf_info.cc.users.length > 0) || (template_wf_info.cc.groups && template_wf_info.cc.groups.length > 0))
			{
				self.showCC(true);
				actionDetail.getField("cc").setDisabled(true);
				actionDetail.setValue("cc", template_wf_info.cc);
			} else{
				self.showCC(false);
			}
		}

		self.viewWF = function() {
			self.openActionDialog();
		}

		self.disableProjCostRateField= function(disableprojrate){
		var projOverRideDe = upperform.getField("uuu_project_rate_override");
				if(projOverRideDe)
				if(disableprojrate)
					projOverRideDe.setDisabled(true);
		         else
		         	projOverRideDe.setDisabled(false);

		}
		self.disableBaseCostRateField = function(disablebaserate){
		 var baseOverRideDe = upperform.getField("uuu_base_rate_override");
				if(baseOverRideDe)
				 if(disablebaserate)
					baseOverRideDe.setDisabled(true);
				else
					baseOverRideDe.setDisabled(false);

		}
		self.disableCurrencyPicker = function(){
			var currencydepicker = upperform.getField("currencyid");
			if(currencydepicker){
				currencydepicker.setDisabled(true);
				currencydepicker.setProperty("hyperlink",true);
			}

  	     }

        self.showBid = function() {
            self.openBids(0);
        }

        self.openBid = function() {
            self.openBids(1);
        }

        self.openBids = function(mode) {
            if(PPP.master_vendor === "") {
                U.AlertByKey("no_master_vendor_defined")
                return;
            }
            if(PPP.bidder_url === "") {
                U.AlertByKey("no_bid_access_url");
                return;
            }
            var activeDraftsExists = false;
            var activeDrafts = "";
            if(mode == 1)  { //Invite Bid
                inviteBidClickpublic = true; //need to see where we are using this flag
                if(typeof(PPP.data.upper.uuu_freeze_rfb) != "undefined"  && PPP.data.upper.uuu_freeze_rfb == 1 ) {// needed this check $design_model == $model here
                    var rfbduedate = PPP.data.upper.uuu_rfb_due_date;
                    if(typeof(rfbduedate) == "undefined" || rfbduedate == null || rfbduedate == "") { // should never happen but just in case..
                        U.AlertByKey("rfb_date_required");
                        return;
                    }
                    var height=540; var width=720;
                    
                    var action;
                    if(PPP.config.public_bidding == "1") {
                         action = "invite_bids=1&bid_type=public&model="+recordInfo.config.context.prefix+"&id="+recordInfo.config.context.rec_id+"&record_no="+PPP.data.upper.record_no+"&project_id="+recordInfo.config.context.pid+"&all_bidders=1";
                        
                    }else{
                    	var proj_ven = "true";
                    	if(self.spec.form.params.proj_ven == undefined){
                    		proj_ven = "false";
                    	}
                    	action ="invite_bids=1&bid_type=private&model="+recordInfo.config.context.prefix+"&id="+recordInfo.config.context.rec_id+"&record_no="+PPP.data.upper.record_no+"&project_id="+recordInfo.config.context.pid+"&proj_ven="+proj_ven+"&all_bidders=0";
					}
					
					U.loadDefer("#invite-bids-defer").then(function(){
						oj.Context.getContext($("#invite-dialogWrapper")[0]).getBusyContext().whenReady().then(function(){
							var inviteDateDialog = document.getElementById("invite-dialogWrapper");
							var pickerDialog = ko.dataFor(inviteDateDialog);
							self.loadInviteConfiguration(action);
							pickerDialog.loadConfiguration({P: configuration,upperform:upperform});		
						});		
					})
                   		
                    return;
                }

                var rfbduedate = upperform.getField("uuu_rfb_due_date").getValue();
                if(typeof(rfbduedate) == "undefined" || rfbduedate == null || rfbduedate == "") {
                    U.AlertByKey("rfb_date_required");
                    return;
                }

                U.ConfirmByKey("pre_initialize_bid_process",function(cb){
                    if(cb) {
                       // if (!wf_verify(999))
                        // return;
                       self.setValidationForm(upperform,"upper");
                        var errorControl = self.getErrorControl();
                        if(errorControl && errorControl.errors.length > 0) {
                            self.displayErrorList();
                            return;
                        } else {
                            self.btnError(false);
                        }
                        var  url = "/bp/mod/bp/record/check_active_drafts";
                        var payload = {};
                        payload.process_id =  PPP.data.workflow.process_id,
                        payload.task_node_id =  recordInfo.config.context.task_node_id,
                        payload.user_id = recordInfo.config.context.curruserid;
                        new Promise(function(resolve, reject) {
                            U.rest('POST',url, payload, function(response) {
                                if(response.active_drafts && response.active_drafts.length > 0) {
                                    activeDrafts = response.active_drafts;
                                    activeDraftsExists = true;
                                }
                                resolve();
                            });
                        }).then(function() {
                           if(!activeDraftsExists){
                                        var url = "/bp/mod/bp/record/savedraft";
                                        var data = self.getDraft("fromRfbBidInvite");
                                        new Promise(function(resolve, reject) {
                                        U.rest('POST', url, data, function(response) {
                                           if(response.errors.length > 0){
                                               U.Alert("Error in saving draft::" +JSON.stringify(response.errors));
                                               return;
                                           }
                                        resolve();
                                        });
                                        }).then(function() {
                                            self.preparePayload();
                                            self.payload.sendrfbrec = false; //flag to block rfb rec send targets
                                            new Promise(function(resolve, reject) { // modify record service call
                                               U.rest('POST', '/bp/mod/bp/record/save', self.payload, function(response) {
                                                 if(response.errors.length > 0){
                                                       U.Alert("Error in saving Record::" +JSON.stringify(response.errors));
                                                       return;
                                                  }
                                                  resolve();
                                               });
                                            }).then(function() {
                                        var params= {};
                                        params.id = recordInfo.config.context.rec_id;
                                        params.model = recordInfo.config.context.prefix;
                                        U.rest('POST','/bp/mod/bp/record/check_rfb_due_date', params, function(response) {
                                          if(response.rfb_due_date_crossed && response.rfb_due_date_crossed === "true"){
                                                U.AlertByKey("due_date_cant_be_earlier_than_today");
                                                //roll back transaction
                                           } else {
                                                var srcUrl = "/bp/mod/bp/record/open/" + recordInfo.config.context.prefix + "/" + recordInfo.config.context.rec_id+ "/" + PPP.from_qbt + "/" + PPP.qbt_id;
                                                srcUrl += "?project_id=" + recordInfo.config.context.pid;
                                                srcUrl += "&initialize_bid=1";
                                                isInviteButtonClick = true;
                                                U.replaceLocation(srcUrl);
                                                $("#record-container").html(U.getProcessingDotsHTML());
                                            }
                                            });
                                         });
                                });
                            } else { // completion policy
                                var users = "";
                                for(var i=0; i<activeDrafts.length; i++){
                                    var activeDraft = activeDrafts[i];
                                    var creator = activeDraft.creator;
                                    users += users+""+creator+";";
                                }
                                U.AlertByKey("only_one_user_can_have_valid_draft", users);
                            }
                        });
                    }
                });
            }
            if(mode ==0 || mode == 2) {//Show Bids and bid picker comes here
                var endform = (PPP.config.context.endform == true) ? 1 : 0;
                // all_bidders : 2 = bidders who have responded
                var action = "/bp/studio/bp/rfb/bidders_log.vm?record_no="+PPP.data.upper.record_no+"&id="+recordInfo.config.context.rec_id+"&model="+recordInfo.config.context.prefix+
                                        "&all_bidders=2&project_id="+recordInfo.config.context.pid+"&endform="+endform;
                // Need to include the follwoing conditions
               /* if (mbean.${model}_uuu_rfb_winning_bid && mbean.${model}_uuu_rfb_winning_bid.getValue() != null) {
                   action = action + "&winning_bid=" + mbean.${model}_uuu_rfb_winning_bid.getValue();
                }
                if(mode == 2){
                    action = action + "&fromBidPicker=1&win_tab_id=#jsEncoder($!win_tab_id)";
                }*/
			
			rfbRecordNumber = recordInfo.comments["record_no"];
			var context = recordInfo.config.context;
			// var url = "/bp/mod/bp/picker/log/bid?pickerType=bid"+"&prefix=urfb";
			var pickerType ='bid';
			var rec_no=context.rec_id;
			var project_id = context.pid;
			var all_bidders;
			var masterVendorRef=PPP.master_vendor;
			self.isShowBidsTemplate(true);
			
			var uuu_rfb_winning_bid = "";
			if(typeof(recordInfo.upperform.getField("uuu_rfb_winning_bid"))!= "undefined" ){
				uuu_rfb_winning_bid = recordInfo.upperform.getField("uuu_rfb_winning_bid").getDisplay();
				console.log("rfb:: "+uuu_rfb_winning_bid);
			}
			
			
			if(mode ==0 )
				all_bidders=2;
			else
				all_bidders=0;
				
			var results;
			var pickerDialog ="";
			var design = {data_source:"bid",fieldname:"company",module:"urfb"};
			
			self.openshowTemplateLog(context,rfbRecordNumber,all_bidders,uuu_rfb_winning_bid,masterVendorRef);
					
                return;
            }
        }

        self.createBid = function() {
            var payload = {};
            payload.model = recordInfo.config.context.prefix;
            payload.a = "form.bid.0";
            payload.b = recordInfo.config.context.prefix;
            payload.srcid = recordInfo.config.context.rec_id;
            payload.id = recordInfo.config.context.rec_id;
            payload.source = "rfb";
            payload.vendor_id = PPP.vendorId;
            payload.isShowBidsView="false";
            U.rest('POST','/bp/mod/bp/record/createbid', payload, function(response) {
                if(response.due_date_crossed && response.due_date_crossed == "true") {
                    U.AlertByKey("due_date_cant_be_earlier_than_today");
                    return;
                } else{
                    if(response.updatedBean) {
                        var srcUrl = "/bp/mod/bp/record/open/" + recordInfo.config.context.prefix + "/" + response.updatedBean.id + "/" + PPP.from_qbt + "/" + PPP.qbt_id;
                        srcUrl += "?__uref=" + U.uref;
                        srcUrl += "&a=form.bid.0";
                        srcUrl += "&b="+recordInfo.config.context.prefix;
                        srcUrl += "&srcid="+response.updatedBean.id;
                        srcUrl += "&source=rfb";
                        srcUrl += "&vendor_id="+PPP.vendorId;
                        srcUrl += "&id="+response.updatedBean.id;
                        srcUrl += "&create_bid=1";
                        srcUrl += "&model="+recordInfo.config.context.prefix;

                       if(bidderwin && !bidderwin.closed)
                        	bidderwin.close();

                       bidderwin =  U.open(srcUrl, {name:'oj_bp_' + recordInfo.config.context.prefix + '_' + response.updatedBean.id,w:1030,h:620,method:'get'});
                    }
                }
            });
        }

        self.liBean = new LiBean(self, PPP, recordInfo);

        self.saveBidDraft = function(){
            self.saveBid("biddraft");
        }

        self.submitBid = function() {
            self.saveBid("submit")
        }

        self.saveBid = function(action) {
            self.setValidationForm(upperform,"upper");
            var errorControl = self.getErrorControl();
            if(errorControl && errorControl.errors.length > 0) {
                self.displayErrorList();
                return;
            } else {
                self.btnError(false);
            }
            var payload = {};
            payload["data"] = {};
            var allFields = upperform.extend().getFields();
            var comma = "";
            var editablefields = "";
            for(var i = 0; i < allFields.length; i++) {
                var f = allFields[i];
                if(f.getValue()) {
                    payload.data[f.name] = f.getValue();
                    editablefields += comma + f.name;
                    comma = ",";
                }
            }
            payload["saveaction"] = "save";
            if(typeof(action) != "undefined" && action == "submit") {
                payload["saveaction"] = "submit";
                editablefields += comma + "process_status";
            }
            payload["rfb_model"] = recordInfo.config.context.prefix;
            payload["rfb_id"] = recordInfo.config.context.rec_id;
            payload["uuu_parent_id"] = PPP.data.upper.uuu_parent_id;
            payload["editablefields"] = editablefields;

            U.rest('POST', '/bp/mod/bp/record/savebid', payload, function(response) {
                if(response.due_date_crossed && "true" === response.due_date_crossed){
                    U.AlertByKey("action_prohibited");
                    return;
                }
                else {
                    var title = PPP.data.upper.title;
                    if(typeof(action) != "undefined" && action == "submit") {
                        if(title) {
                            title = _.escape(title);
                            U.Notification(U.translateMessage("post_submit_bid",title),function(){isBidButtonClick = true;window.close();});
                        }
                        else {
                            U.Notification(U.translateMessage("post_submit"),function(){isBidButtonClick = true;window.close();});
                        }
                    }
                    else {
                        if(title) {
                           title = _.escape(title);
                           U.Notification(U.translateMessage("record_saved_successfully",title));
                        }
                        else {
                            U.Notification(U.translateMessage("saved_successfully"));
                        }
                    }
                }
            });
        };

        self.isDocumentBP = function(){
	        return self.spec.studio.source == "document";
	    };

	    self.isDocumentBpWithFolderStructure = function(){
	    	return self.spec.studio.source == "document" && self.spec.studio.subtype == "wfs";
	    };

	    self.isDocumentBpWithoutFolderStructure = function(){
	        return self.spec.studio.source == "document" && self.spec.studio.subtype == "wofs";
	    }

        self.deleteBid = function() {
                var cb = function(yn) {
                if(!yn)
                    return;
                var payload = {};
                payload.model = recordInfo.config.context.prefix;
                payload.design_model = recordInfo.config.context.prefix;
                payload.id = recordInfo.config.context.rec_id;
                payload.uuu_parent_id  = PPP.data.upper.uuu_parent_id;
                U.rest('POST','/bp/mod/bp/record/deletebid', payload, function(response) {
                    if(response.due_date_crossed && response.due_date_crossed == "true") {
                        U.AlertByKey("due_date_cant_be_earlier_than_today");
                        return;
                    } else{
                        var title = PPP.data.upper.title;
                        if(title) {
                           title = _.escape(title);
                           U.Notification(U.translateMessage("post_delete_bid",title),function(){isBidButtonClick = true;window.close();});
                        }
                        else {
                           U.Notification(U.translateMessage("post_delete"),function(){isBidButtonClick = true;window.close();});
                        }
                    }
                });
            };
            U.ConfirmByKey("pre_delete_bid",cb);
        }

        self.withdrawBid = function() {
            var cb = function(yn) {
                if(!yn)
                    return;
                var payload = {};
                payload.model = recordInfo.config.context.prefix;
                payload.design_model = recordInfo.config.context.prefix;
                payload.id = recordInfo.config.context.rec_id;
                payload.uuu_parent_id  = PPP.data.upper.uuu_parent_id;
                U.rest('POST','/bp/mod/bp/record/withdrawbid', payload, function(response) {
                    if(response.due_date_crossed && response.due_date_crossed == "true") {
                        U.AlertByKey("due_date_cant_be_earlier_than_today");
                        return;
                    } else{
                        var title = PPP.data.upper.title;
                        if(title) {
                             title = _.escape(title);
                             U.Notification(U.translateMessage("post_withdraw_bid",title),function(){isBidButtonClick = true; window.close();});
                        }
                        else {
                           U.Notification(U.translateMessage("post_withdraw"), function() {isBidButtonClick = true; window.close();});
                        }
                    }
                });
             };
            U.ConfirmByKey("pre_withdraw_bid",cb);
        }
        
        self.launchAllocation = function(){
        	var context = recordInfo.config.context;
        	if(context.readonly || (context.no_workflow && !this.btnSubmit()) || (this.detailInfo[0] && this.detailInfo[0].params && this.detailInfo[0].params.additem != "1")) {
                var alloc_url = "/bp/studio/bp/cost/allocation_log";
                var windowName = "AllocationWindow";
                var params = {model: context.prefix, project_id: context.pid, record_id: context.rec_id, record_no: PPP.data.upper.record_no, canAdd: false, viewOnly: true};
                U.open(alloc_url, {name:windowName,w:650,h:580,method:'post'}, params);
                return;
            }
       	 U.call("/bp/studio/bp/cost/can_add_allocation",{model: recordInfo.config.context.prefix}, function(r) {
       	        if(!r.canAdd) {
       	            if((r.allocation_error1).length > 0 ) {
       	            	U.Alert(r.allocation_error1);
       	            }
       	            else if((r.allocation_error2).length > 0 ) {
       	            	U.Alert(r.allocation_error2);
       	            }
       	            
       	            return;
       	        }
       	        var canAddA = r.canAdd;
       	        //create non-workflow record to associate the allocation
       	        if(context.no_workflow && context.rec_id==0){
       	        	self.silentSave().then(function(response){
       	        		if(response.errors.length > 0) {
       	        			return;
       	        		}else {
       	        			//record created
       	        			var alloc_url = "/bp/studio/bp/cost/allocation_log";
       	       	        	var windowName = "AllocationWindow";
       	       	        	var params = {model: context.prefix, project_id: context.pid, record_id: context.rec_id, record_no: PPP.data.upper.record_no, canAdd: canAddA};
       	       	        	U.open(alloc_url, {name:windowName,w:650,h:580,method:'post'}, params);
       	       	        	return;
       	        		}
       	        	});
       	        }
       	        if((context.no_workflow && context.rec_id!=0) || !context.no_workflow){
       	        	var alloc_url = "/bp/studio/bp/cost/allocation_log";
       	        	var windowName = "AllocationWindow";
       	        	var params = {model: context.prefix, project_id: context.pid, record_id: context.rec_id, record_no: PPP.data.upper.record_no, canAdd: canAddA};
       	        	U.open(alloc_url, {name:windowName,w:650,h:580,method:'post'}, params);
       	        	return;
       	        }
       	        });
       }
       
        self.launchPaySchedulesRegular= function(val){
       	var context = recordInfo.config.context;
       	var url="/bp/studio/bp/cost/lease/paymentschedules/log?model="+context.prefix+"&straightline=0&record_id="+ context.rec_id+"&bp_title="+context.bpName;			
       	U.open(url,{name:"PaymentSchedules",w:800,h:500,method:'post'});
       }
       
       self.launchPaySchedulesSL= function(val){
       	var context = recordInfo.config.context;
       	var url="/bp/studio/bp/cost/lease/paymentschedules/log?model="+context.prefix+"&straightline=1&record_id="+ context.rec_id+"&bp_title="+context.bpName;			
       	U.open(url,{name:"PaymentSchedules",w:800,h:550,method:'post'});    }
       
       self.createSnapshots =  function(){
       	var context = recordInfo.config.context;
       	if(context.no_workflow && context.rec_id==0)
       		return;
       	var action  = "/bp/studio/bp/new_snapshots_manual?model="+context.prefix+"&type=manual&no_workflow="+context.no_workflow+"&file_date=-1&id="+context.rec_id+"&fromOjet=true";
   		U.open(action,{name:"newSnapshot",w:440,h:330,method:'post'});
       }
       
       self.viewSnapshots = function(){
       	var context = recordInfo.config.context;
       	var action = "/bp/studio/bp/snapshots?model="+context.prefix+"&no_workflow="+context.no_workflow+"&id="+context.rec_id;
       	U.open(action,{name:"viewSnapshots",w:710,h:446,method:'post'});
       }

       window.manualSnapshotDetails = function(title,des,mode,rec_id,newid,filedate)
       {
    	   self.preparePayload();
    	   var action;
    	   var context = recordInfo.config.context;
    	   var module = context.prefix;
    	   var params={id:context.rec_id,
    			   title:title,
    			   printable:6,
    			   size:1000000,
    			   page:1,
    			   srcid:context.rec_id,
    			   source_id:context.rec_id,
    			   model:module,
    			   source:"cost",
    			   dummy:"a.pdf",
    			   project_id:context.pid,
    			   fromOjetSS:"true",
    			   description:des,
    			   record_id:context.rec_id,
    			   li_num:newid,
    			   isManual:"true"
    	   };

    	   if(self.no_workflow){
    		   if(PPP.vendorId != 0 || context.formId == "form.bid.0"){
    			   $.extend(params, {a:"form.bid.0",b:module});
    		   }
    		   else{
    			   $.extend(params, {a:"form.0",b:module});
    		   }
    		   $.extend(params, {isworkflow:0,project_id:context.pid});
    		   action = "/bp/studio/bp/open.pdf?_a"+Math.round(100*Math.random())+"="+Math.round(10000*Math.random());
    	   }
    	   else{
    		   $.extend(params, {isworkflow:1,fromcostlog:1,projectId:context.pid,process_id:context.process_id,
    			   userId:context.curruserid,selected_node_id:recordInfo.config.context.task_id});
    		   action = "/bp/"+module+"/log/open.pdf?_a"+Math.round(100*Math.random())+"="+Math.round(10000*Math.random());	
    	   }
    	   $.extend(params,self.payload);
    	   U.call(action,params,function(result){
    		   console.log("snapshots created successfully");
    	   });
       }


        self.loadInviteConfiguration = function(action) {
			if (configuration)
				return Promise.resolve(configuration);
			else
				return new Promise(function(resolve, reject) {
					var srcUrl = "/bp/mod/bp/record/inviteBids";
                    srcUrl += "?__uref=" + U.uref;
                    srcUrl += action;
					U.call(srcUrl, null,
					function(result) {
						configuration = result;
						resolve(result);
					},
					function(error) {
						reject("InviteBid_Dialog_Not_Opening");
					});
				});
	    }
        
        self.viewOnDrawingSpaces = function(){
        
        	U.call("/bp/mod/dm/doc/file/virusscanstatus", 
        		{ids:recordInfo.config.context.rec_id , file_type : 'space', from : 'space', model: PPP.spec.upper.prefix },
                function( data ) {
                	if( data.uuu_content_status == 1 || data.uuu_content_status == 2 ){
                        var key = 'virus_scanner_threat_alert_msg';
                        var fileName = '';
                        if( data.uuu_content_status == 1 ) {
                        	key = 'virus_scan_pending_alert_msg_no_display';
			    			fileName = data.pending_files[0];
                        }
                        else{
                        	fileName = data.virus_affected_files[0];
                        }
                                    			
                        U.AlertByKey( key, fileName );
                        return;
                    }
                    else {
        				var actionURL = "/bp/space/drawing/view?model="+PPP.spec.upper.prefix+"&spaceids="+recordInfo.config.context.rec_id;		
						window.open(actionURL,"","resizable=no,status=no,menubar=no,left="+(screen.width-1000)/2+",top="+(screen.height-650)/2+",height=650,width=1000");
        			}
        		}
        	);
        }

        self.getIsRef = function(record_no, model)
        {
        	var isRef = "0";
        	var action = "/bp/studio/bp/planning/deleteReferenceCheckPlanRef";
        	var data = {
        			model: model,
        			record_no: record_no
        		};
        	
        	U.call(action, data, function(r){
        		isRef = r.ref;
        	},true);
        	
        	if(isRef == "1")
        		return isRef;
        	else {
        		action = "/bp/studio/bp/planning/deleteReferenceCheck";
        		U.call(action, data, function(r){
        			isRef = r.ref;
        		},true);
        		return isRef;
        	}
        }


        
        self.deletePlanning = function() {
        	var context = recordInfo.config.context;
        	var model = context.prefix; 
        	var params = {};
        	params.model = model;
        	params.access = 'Full Access';
        	U.call("/bp/mod/bp/record/getPlanningPermissions", params, function(results){
        		if(results.planningPermissions != null && results.planningPermissions != undefined){
        			if(!results.planningPermissions){
        				U.AlertByKey("no_permission_alert");
        				return;
        			}
        		}
        	});
//    		#set ($srcid = $web.getFilteredP("srcid"))
    		
    		U.ConfirmByKey("confirm_del_planning_items", function(response) {
    			if(!response)
    				return;
    			var record_no = PPP.data.upper.record_no;
    			var flag = self.getIsRef(record_no, model);
    			
    			if (flag == "1")
    			{
    				U.AlertByKey("cant_delete_planning_item");
    				return;
    			}
    			
    			var action = "/bp/studio/bp/planning/delete";
    			var data = {
    					model: context.prefix,
    					record_no: record_no,
    					srcid: context.rec_id
    				};
    			
    			U.call(action, data, function(r){
    			},true);
    		
//    			#set ($fromPlanningSheet = $web.getFilteredP("viewFromPlanningSheet"))
//    			#if("$!fromPlanningSheet" == "1")
//    				opener.refresh();
//    			#else
//    				opener.submit_search();
//    			#end
				window.close();
    		    window.opener.submit_search();

    		});
        }
        
        self.republishCopyToUnpub = function(){
        	var fileIds = [];
    		self.republishErrors().forEach(function(element){
    			fileIds.push(element.file_id);
    		});
			var payload = {
				fileIds : fileIds.join(","),
            };
			U.ShowWaiting();
            U.rest('POST', '/bp/mod/bp/record/sendToUnpublish', payload,
            function(response) {
                U.CloseShowWaiting();
                if(!response.errors){
                	self.submitRecordData();
                	self.republishCloseDialog();
                }
            },
            function(err, status) {
                U.Alert("Error2:"+err.message+" Status:"+status);
            });
    	}
    	self.republishSkipFiles = function(){
    		var fileIds = [];
    		self.republishErrors().forEach(function(element){
    			fileIds.push(element.file_id);
    		});
			var payload = {
				fileIds : fileIds.join(","),
            };
			U.ShowWaiting();
            U.rest('POST', '/bp/mod/bp/record/resetRepublish', payload,
            function(response) {
                U.CloseShowWaiting();
                if(!response.errors){
                	self.submitRecordData();
                	self.republishCloseDialog();
                }
            },
            function(err, status) {
                U.Alert("Error2:"+err.message+" Status:"+status);
            });
    	
    	}
    	self.republishCloseDialog = function(){
    		$("#republishDialog").ojDialog("close");

    	}
    	self.disableCMxFields = function(){
    		var formulas = self.spec.upper.formula;
    		for(var i = 0; i < formulas.length; i++){
    			if(/uuu_cm(([1-9])|([1][0-9])|([2][0-5]))_code/.test(formulas[i].name)){
    				var formulaFields = formulas[i].value.split('+');
    				_.each(formulaFields, function(formulaField){
    					upperform.getField(formulaField.trim()).setDisabled(true);
    				});
    				break;
    			}
    		}
    	};

    	self.validateCMxFormula = function(errorControl){
    		var formulas = self.spec.upper.formula;
    		for(var i = 0; i < formulas.length; i++){
    			if(/uuu_cm(([1-9])|([1][0-9])|([2][0-5]))_code/.test(formulas[i].name)){
    				var formulaFields = formulas[i].value.split('+');
    				var codeSep = formulas[i].separator;
    				if(codeSep != undefined && codeSep != ''){
    					_.each(formulaFields, function(formulaField){
    						var fieldValue = upperform.getField(formulaField.trim()).getDisplay();
    						if(fieldValue && fieldValue.indexOf(codeSep)>-1){
    							var fieldLabel = upperform.getField(formulaField.trim()).design.label;
    							errorControl.add(fieldLabel, fieldLabel + " : "+U.translateMessage("code_separator_not_allowed",codeSep));
    						}
    					});
    					
    				}
    				break;
    			}
    		}
    	};
    	
    	self.openReservationDialog = function(menuName){

    		var calendarEnabledDeName= "";
    		
    		var upperFromFields = document.getElementById("formUpper").extend().fields;
    		for(var i=0;i<upperFromFields.length;i++){
    			if(typeof upperFromFields[i]["isCalendarEnabled"] != "undefined" && upperFromFields[i]["isCalendarEnabled"] == true ){
    				calendarEnabledDeName=upperFromFields[i]["name"];
    				break;
    			}
    				
    		}
    		document.getElementById("formUpper").extend().getField(calendarEnabledDeName).extend().updateEventHandler(menuName);
    		
    	}
    	
    	self.cancelReservationvOpen = function(){
    		
    		U.loadDefer("#cancel-reservation-defer").then(function(){
				oj.Context.getContext($("#cancelReservation-dialog")[0]).getBusyContext().whenReady().then(function(){
					var upper = PPP.data.upper;
		    		var context = recordInfo.config.context;
					var cancelReserveDialog = document.getElementById("cancelReservation-dialog");
					var cancelReservationDialog = ko.dataFor(cancelReserveDialog);
					var bpName = recordInfo.config.context.bpName;
					var record_no = upper.record_no;
					cancelReservationDialog.loadConfiguration({model:context.prefix,id:context.rec_id,recordStatus:upper.status,project_id:context.pid,status:"no",bpName:bpName,record_no:record_no});	
				});		
			})
    		
        }
    	
    	  function openDialog(dialogID, width, height) {
              var left = ($(window).width() - width) / 2;
              var top = ($(window).height() - height) / 2;
              var $dialog = $("#" + dialogID);
              $dialog.ojDialog("option", "resizeBehavior", "none");
              $dialog.ojDialog("widget").css({
                  "left": left,
                  "top": top
              });
              $dialog.ojDialog("open");
          }
    	
    	U.Event.subscribe('terminate_reservation', function() {
    		var cb = function(){
    		   //window.close();
    		   window.opener.submit_search();
            }
    		U.Notification(U.translateMessage("record_suc_terminated", recordInfo.config.context.bpName, PPP.data.upper.record_no));
    		window.close();
    		window.opener.submit_search();
    		
    	});
    	
    	self.timeDifference =function(date_1,date_2,datetype) 
        {
        	if(date_1 == null || date_2 == null)
        		return "";
        	if (typeof(date_2)=="undefined" || typeof(date_2) == "string" || typeof(date_1) == "undefined"|| typeof(date_1) == "string")
        		return "";
        	var difference =0;
        	var hCount =0;
            difference = 
        		Date.UTC(self.y2k(date_1.getYear()),date_1.getMonth(),date_1.getDate(),date_1.getHours(),date_1.getMinutes(),date_1.getSeconds()) 
        		- Date.UTC(self.y2k(date_2.getYear()),date_2.getMonth(),date_2.getDate(),date_2.getHours(),date_2.getMinutes(),date_2.getSeconds());
        	difference = difference/1000/60/60/24;

        	if(datetype == "Calendar")
        		return difference;
        	if ( difference < 0 )
        	{
        		hCount =holidays(date_2,date_1);
        		daysDifference = eval(difference +hCount);
        	}
        	else{
        		hCount =holidays(date_1,date_2);
        		daysDifference = eval(difference -hCount);
        	}
        	return daysDifference;
        }
        
        self.y2k =function(number) { 
      	  return (number < 1000) ? number + 1900 : number; 
        }
        
        function convertTimestoAmPm(hh,mm){
 			var temp = "";
 			var ampm = "AM"; 
 			
 			if(hh > 11) {
 				ampm = "PM";
 			}
 			
 			if(hh == 0){
 				hh = "12"; 
 			}
 			
 			if(mm == 0){
 				mm = "00"; 
 			}
 						
 			if(hh > 12){
 				hh = hh - 12;
 			}
 			
 			/*if(hh > 0 && hh < 10){
 			 	hh = "0" + hh;
 			}*/
 			
 			/*if(mm < 10){
 				mm = "0"+mm;
 			}*/
 			temp = hh + ":" + mm + " " + ampm;
 			return temp;
 			
 		}
    	
   }
  	return RecordModel;
});