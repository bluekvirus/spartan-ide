/**
 * @author Patrick Zhu
 * @created 2017.02.06
 */
var _ = require('underscore'),
path = require('path'),
fs = require('fs-extra');

module.exports = function(server){

	var profile = server.get('profile');
	var router = server.mount(this);
	server.secure(router);

	router.post('/generate', function(req, res){
		return res.status(200).json(req.body);
	});

};