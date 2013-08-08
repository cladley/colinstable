// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

		// undefined is used here as the undefined global variable in ECMAScript 3 is
		// mutable (ie. it can be changed by someone else). undefined isn't really being
		// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
		// can no longer be modified.

		// window and document are passed through as local variable rather than global
		// as this (slightly) quickens the resolution process and can be more efficiently
		// minified (especially when both are regularly referenced in your plugin).

		// Create the defaults once
		var pluginName = "colinstable";

		var defaults = {
			pagination : false,
			items_per_page : 8,
			draggable : false
		};

		// The actual plugin constructor
		function ColinsTable ( element, options ) {
				this.table = element;
				this.$table = $(element);

				// merge defaults and user  options
				this.options = $.extend( {}, defaults, options );
				this._defaults = defaults;
				this._name = pluginName;
				this.init();
		}

		ColinsTable.prototype = {
				init: function () {
						var self = this;
						this.rowsPromise = null;
						this.tbody = this.$table.children('tbody')[0];
						this.$tbody = $(this.tbody);
						window.bb = this.$tbody;
						if(this.options.url){
							this.fetchRecords(this.options.url);
							// Not implemented yet
							//this.add_loading_overlay();
						}
							

						this.setup_extra_html(this.$table);

						if(this.options.url) this.createRows();
				},
				// Create a container around the table and add a footer div
				setup_extra_html : function(table){
					this.container = $('<div>', {
						'class' : 'cltable_container'
					});
					this.footer = document.createElement('div');
					this.footer.className = 'cltable_footer';

					table.wrap(this.container);
				//	this.container.append(this.footer);
					$('.cltable_container').append(self.footer);
			
				},
				// places a loading screen on top of the tbody element when 
				// rows are being fetched from the server
				
				// Get rows from a url that the user passed in
				fetchRecords : function(url){
				
					var self = this;
					var dfd = $.ajax({
						dataType : 'json',
						url : url,
						type : 'GET'
					});

					this.rowsPromise = $.Deferred();
					dfd.done(function(data){
					
						self.rowsPromise.resolve(data);
					})
					.fail(function(err){
						console.log(err);
					});
				},
				getRows : function(){
					// if its null, it means that we are just getting the rows that
					// are already in the table, otherwise we are getting the rows
					// from a server, so we return the promise
					if(this.rowsPromise === null){
						this.rowsPromise = $.Deferred();
						var rows = this.$tbody.children('tr');
						this.rowsPromise.resolve(rows);

					}else{
						return this.rowsPromise;
					}
				},
				createRows  :function(rows){
					var self = this;
					var frag = document.createDocumentFragment();
					var trRows = [];
			
					this.getRows().done(function(data){
				
						$.each(data, function(indx, obj){
							var tr = document.createElement('tr');
							for(var key in obj){
								var td = document.createElement('td');
								td.textContent = obj[key];
								tr.appendChild(td);
							}
							frag.appendChild(tr);
						});
						self.tbody.appendChild(frag);
				
					})
					.fail(function(err){
						console.log("something went wrong in the createRows()")
					});
				}
			
		};

		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn.colinstable = function ( options ) {
				return this.each(function() {
						if ( !$.data( this, "plugin_" + pluginName ) ) {
								$.data( this, "plugin_" + pluginName, new ColinsTable( this, options ) );
						}
				});
		};

})( jQuery, window, document );
