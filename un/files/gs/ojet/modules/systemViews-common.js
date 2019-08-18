if (typeof(jQuery) !== 'undefined') define('jquery', [], function() { return jQuery; });
if (typeof(U) !== 'undefined') define('unifier_util', [], function() { return U; });

define([
	'text!../modules/dummy.json',
	'../modules/systemViews/log',
	'text!../templates/systemViews/log.tmpl.html'
], function(){});
