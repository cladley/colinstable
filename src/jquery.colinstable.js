// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

		// Helper method for jQuery
		$.fn.swap = function(other) {
			var temp = $(this).clone(true);
    		$(this).replaceWith($(other).after(temp));
    		return temp;
		};

		
		//////////////////////////////////////////////////////////
		//  sorter   :  Setup and implements sorting on columns //
		//////////////////////////////////////////////////////////
		var sorter = {
			init : function(table,$table,columns){
				this.table = table;
				this.$table = $table;
				this.columns = columns;
				this.setup_sorting(this.columns);
			},
			// We setup sorting on column names that the user passes in
			setup_sorting : function(column_names){
				debugger;
				var self = this;
				var dict = {};
				// first record which columns and place in object
				// so that we can easily find out later if a column
				// is to be sorted
				$.each(column_names, function(idx,column){
					dict[column] = '_';
				});

				var ths = this.$table.find('th');
				// Find out which rows are to be sorted and setup 
				// click on each one, add an icon.
				for(var i = 0; i < ths.length; i++){
					var text = ths[i].textContent;

					if(dict[text]){

						(function(col){
							// create the sort icon
							var icon = self.create_sort_icon();
							ths[i].appendChild(icon.get(0));
							ths[i].setAttribute('data-dir', 'asc');
							var thead = ths[col];
							var dir = 'asc';

							ths[col].addEventListener('click', function(e){
								var cmpfunc = (dir === "asc") ? self.desc_sort : self.asc_sort;
								self.update_icon(icon,dir);
								dir = (dir === "asc") ? "desc" : "asc";

								self.sort_column(col,cmpfunc);

							}, false);

						})(i);
					}
				}
			},

			create_sort_icon : function(){
				var span = $('<span>', {
					'class' : 'sortIcon sort_icon_decend'
				});
				return span;
			},
			// Icon gets changed to reflect the direction of
			// the sorting
			update_icon : function(icon, dir){
				var $icon = $(icon);
				if(dir === 'asc'){
					$icon.removeClass('sort_icon_decend');
					$icon.addClass('sort_icon_ascend');
				}else{
					$icon.removeClass('sort_icon_ascend');
					$icon.addClass('sort_icon_decend');
				}

			},

			sort_column : function(column, cmpfunc){
				var tbody = this.table.getElementsByTagName('tbody')[0];
				var trs = tbody.getElementsByTagName('tr');
				trs = Array.prototype.slice.call(trs);
	

				trs.sort(function(r1,r2){
					var t1 = r1.getElementsByTagName('td')[column].textContent.toLowerCase();
					var t2 = r2.getElementsByTagName('td')[column].textContent.toLowerCase();
					return cmpfunc(t1,t2);
				});

				trs.forEach(function(item,idx){
					tbody.appendChild(item);
				});

			},

			asc_sort : function(obj1,obj2){
				if(obj1 < obj2)
					return -1;
				else if(obj1 > obj2)
					return 1;
				else 
					return 0;
			},
			desc_sort : function(obj1,obj2){
				if(obj1 < obj2)
					return 1;
				else if(obj1 > obj2)
					return -1;
				else 
					return 0;
			}

		};

		//////////////////////////////////////////////////////////
		//  dragger  :  Enable dragging of rows around          //
		//////////////////////////////////////////////////////////
		var dragger = {

			init : function(table, $table, $tbody){
				this.table = $table;
				this.$table = $table;
				this.$tbody = $tbody;
				this.$thead = this.$table.children('thead');
				this.thead_height = this.$thead.outerHeight();
				this.table_top_position = this.$table.offset().top;
				this.isDragging = false;
				this.$tbody.on('mousedown', 'tr', $.proxy(this.onMouseDown, this));
				this.$tbody.on('mouseover', 'tr', $.proxy(this.onMouseOver, this));
			},
			onMouseDown : function(e){
				this.$table.css({
					'user-select' : 'none'
				});
				this.row_being_dragged = $(e.currentTarget);
				this.row_being_dragged_index = e.currentTarget.rowIndex;
				this.row_being_dragged.css({
					'opacity' : '0.4',
					backgroundColor : 'lightblue'
				});
				this.isDragging = true;
				this.$tbody.on('mouseup', 'tr', $.proxy(this.onMouseUp, this));
			},
			onMouseUp: function(e){
				this.isDragging = false;
				this.$table.css('user-select', '');
				this.row_being_dragged.css({
					'opacity': '1',
					backgroundColor : ''
				});
				this.$tbody.off('mouseup', this.onMouseUp);
			},
			onMouseOver : function(e){
				if(this.isDragging){
					var row = $(e.currentTarget);
					var row_index = e.currentTarget.rowIndex;

					if(row_index !== this.row_being_dragged_index){
						this.swaprows(row_index, this.row_being_dragged_index,this.$tbody);
						if(this.row_being_dragged_index > row_index)
							this.row_being_dragged_index--;
						else
							this.row_being_dragged_index++;
					}
				}
			},
			swaprows : function(i,j,tbody){
				var r1 = tbody.children('tr')[i-1];
				var r2 = tbody.children('tr')[j-1];
				$(r1).swap(r2);
			}

		};

		//////////////////////////////////////////////////////////
		// paginator : implements pagination on the table       //
		//////////////////////////////////////////////////////////
		var paginator = {
			init : function(table,tbody,getRows, items_per_page){
			
				var self = this;
				this.table = table;
				this.tbody = tbody;
				// Have to change this
				this.footer = this.create_footer();
				$('.cltable_container').append(self.footer);
			

				getRows().done(function(data){
					self.rows = data;
					self.row_count = self.rows.length;
					self.rows_per_page = items_per_page;
					self.num_of_pages = Math.ceil(self.row_count / self.rows_per_page);
					if(self.num_of_pages < 5)
						self.max_counter = self.num_of_pages;
					else
						self.max_counter = 5;

					self.abs_counter = 1;
					self.draw_pagination_control(self.num_of_pages);
					self.showPage(1);
				});
				
			},
			create_footer : function(){
				var div = document.createElement('div');
				div.className = 'cltable_footer';
				return div;
			},
			draw_pagination_control : function(numPages){
				var fragment = document.createDocumentFragment();
				this.btnFirst = this.create_pagin_button('first');
				this.btnPrev = this.create_pagin_button('prev');
				this.btnNext = this.create_pagin_button('next');
				this.btnLast = this.create_pagin_button('last');

				fragment.appendChild(this.btnFirst);
				fragment.appendChild(this.btnPrev);
				this.numbersBar = $('<div>', {
					'class' : 'numbersBar'
				});

				var buttons = this.createNumberBarButtons(1,numPages);
				this.updateNumbersBar(this.numbersBar, buttons);
				this.bar_counter = 1;
				this.first_screen = true;

				fragment.appendChild(this.numbersBar.get(0));
				fragment.appendChild(this.btnNext);
				fragment.appendChild(this.btnLast);
			
				this.footer.appendChild(fragment);
				$(this.footer).on('click', 'a', $.proxy(this.changePage,this));
				this.toggleButtonClass($(buttons[0]));

			},

			// Need to change this function by having some sort of total counter from 1 to the num_pages.
			// just increment

			changePage : function(e){
				var btn_pressed = $(e.target);
				var val = e.target.dataset['btntype'];
				var index = e.target.dataset['index'];
				console.log(this.max_counter);
				if(index) index = parseInt(index);

				switch(val){
					case "prev":
						if(this.first_screen && this.bar_counter === 1) return;

						if(!this.first_screen && this.bar_counter === 1){
							var buttons = this.createNumberBarButtons(this.current_page -1, this.num_of_pages);
							this.updateNumbersBar(this.numbersBar, buttons);
						}
						if(this.bar_counter > 1){
							this.bar_counter--;
							this.abs_counter--;
						} 
						
						this.showPage(this.current_page -1);
						if(this.current_page === 1) this.first_screen = true;
						this.toggleButtonClass(this.current_page);
						break;

					case "next":
						if(this.isLastButton) return;
						if(this.bar_counter === 3 && this.isShortBar){
							var buttons = this.createNumberBarButtons(this.current_page -1,this.num_of_pages);
							this.updateNumbersBar(this.numbersBar, buttons);
							this.first_screen = false;
						}else if(this.bar_counter < this.max_counter){
							this.bar_counter++;
						}

						this.abs_counter++;
					
						this.showPage(this.current_page + 1);
						this.toggleButtonClass(this.current_page);
						break;

					case "first":
						this.showPage(1);
						var buttons = this.createNumberBarButtons(1,this.num_of_pages);
						this.updateNumbersBar(this.numbersBar, buttons);
						this.first_screen = true;
						this.bar_counter = 1;
						this.abs_counter = 1;
						this.toggleButtonClass(1);
						break;

					case "last":
						this.showPage(this.num_of_pages);

						if(this.isShortBar){
							var buttons = this.createNumberBarButtons(this.num_of_pages - (this.max_counter -1), this.num_of_pages);
							this.updateNumbersBar(this.numbersBar,buttons);
						}
						this.first_screen = false;
						this.toggleButtonClass(this.num_of_pages);

						// NOTE, THIS IS WRONG IF WE ONLY HAVE LESS THAN 5 PAGES
						this.bar_counter = this.max_counter;
						this.abs_counter = this.num_of_pages;
						break;

					default:
			
						// If we click the last numbered button, then we have to redraw the numberBar to show the 
						// last remaining from last - 4 to last
						if(btn_pressed.attr('data-isLast')){
							if(this.isShortBar) this.first_screen = false;
							var buttons = this.createNumberBarButtons(this.num_of_pages - (this.max_counter  -1) , this.num_of_pages);
							this.updateNumbersBar(this.numbersBar, buttons);
							this.toggleButtonClass(this.num_of_pages);
							
						}else{

							this.toggleButtonClass(btn_pressed);
						}


						this.showPage(parseInt(val));
						this.bar_counter = index;
						break;
				}


			},
			createNumberBarButtons : function(from,to){
				var btnNums;
				var buttons = [];
				var diff = to - from;
				var max;
			
				if(diff > 4){
					this.isShortBar = true;
					btnNums = [from, from+1, from+2, '...', to];
					max = from + 4;
				}else{
					this.isShortBar = false;
					btnNums	 = [from,from+1,from+2, from+3, from+4];
					max = from + diff;
				}
				var counter = 0;
				for(var i = from; i <= max; i++){
					buttons.push(this.create_pagin_button(btnNums.shift(), ++counter));
				}
		
				var lastBtn = buttons.pop();
			
				lastBtn.setAttribute('data-isLast', 'true');
				buttons.push(lastBtn);
				return buttons;
			},

			create_pagin_button : function(text,index){
				var span = document.createElement('span');
				var a = document.createElement('a');
				a.textContent = text;
				a.setAttribute('data-btntype', text);
				a.setAttribute('data-index', index);
				return a;
			},

			updateNumbersBar : function(bar, buttons){
				bar.empty();
				for(var i = 0; i < buttons.length; i++){
					bar.append(buttons[i]);
				}
			},

			showPage : function(pageNum){
				var rows = this.page(pageNum);
				var frag = document.createDocumentFragment();
				this.current_page = pageNum;
				this.tbody.innerHTML = "";
				
				if(rows && pageNum > 0){
					// if they are plain objects, create tr's for them
					if(!rows[0].tagName || rows[0].tagName !== 'TR'){
						rows = this.createRows(rows);
					}

					if(rows.length < this.rows_per_page){
						// TODO: fill in empty rows if any
					}

					for(var i = 0; i < rows.length;i++){
						frag.appendChild(rows[i]);
					}
					this.tbody.appendChild(frag);
				}

			},
			page : function(pageNum){
				if(pageNum <= this.num_of_pages){
					--pageNum;
					var min = this.rows_per_page * pageNum;
					var max = min + this.rows_per_page;
					return this.rows.slice(min,max);
				}

			},
			toggleButtonClass : function(btn){
				var self = this;
				
				if(this.current_button){
					this.current_button.toggleClass("btndisabled");
				}

				if(typeof(btn) === "number"){
			
					var spns = this.numbersBar.children();
					$.each(spns, function(idx,item){
						if(item.dataset['btntype'] == btn){
							var $item = $(item);
							$item.toggleClass('btndisabled');
							self.current_button = $item;
					
							self.isLastButton = $item.attr('data-isLast');
							return;
						}
					});
				}else{
					this.current_button = btn;
					this.current_button.addClass("btndisabled");
					this.isLastButton = this.current_button.attr('data-isLast');
				}
			}

		};


		// Create the defaults once
		var pluginName = "colinstable";

		var defaults = {
			pagination : false,
			items_per_page : 7,
			draggable : true
		};
		//////////////////////////////////////////////
		//  ColinsTable constructor function        //
		//////////////////////////////////////////////
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
				
						if(this.options.url){
			
							this.fetchRecords(this.options.url);
							// Not implemented yet
							//this.add_loading_overlay();
						}
							
						this.setup_extra_html(this.$table);
						if(this.options.url) this.createRows();
					
						if(this.options.sortOn instanceof Array){
							var sort_control = Object.create(sorter);
							sort_control.init(this.table,this.$table,this.options.sortOn);
						}

						if(this.options.pagination){
					
							var pagtor = Object.create(paginator);
							pagtor.init(this.table,this.tbody,$.proxy(this.getRows, this),this.options.items_per_page);
						}

						if(self.options.draggable){
							var dragTable = Object.create(dragger);
	      					dragTable.init(this.table,this.$table, this.$tbody);
						}
				},

				random : function(){
					console.log("this is random");
					console.log(this);
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
					}
					return this.rowsPromise;
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
