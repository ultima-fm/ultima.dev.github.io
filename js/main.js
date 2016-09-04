'use strict'
$(function(){

	if (!UF) var UF = {};
	UF.api_ultima = 'http://api.ultima.fm';
    UF.audio = $('#audio');
    UF.audio_current_time = $('.player-progress .pp-text-left');
    UF.event_type = 'click';
    UF.player_button = $('.player-btn');
    UF.player_progress = $('header .player-progress');
	UF.player = {
		el: $('.player')[0],
		el_play:  $('#audio')[0],
		el_author:  $('.player-track-artist')[0],
		el_song:  $('.player-track-title')[0],
		state: 'pause',
        setVolume: function() {
            $(UF.player.el_play).prop("volume", "0.5");   
        },
		updateMeta: function() {
		$.get("http://sc.ultima.fm:8001/currentsong?sid=1",
			function (data) {
				data = data || '';
				var meta =  data.split('-');
				$(UF.player.el_author).html(meta[0]);
				$(UF.player.el_song).html(meta[1]);
				console.log(data);
			});
		}
	}
    
    UF.player_button.on(UF.event_type, playStopPlayer);
	UF.player.updateMeta();
    UF.player.setVolume();
    protectEmail();
	getStatisticUsers();
    
	setInterval(function(){
		UF.player.updateMeta();
	}, 5000);

	setInterval(function() {
		getStatisticUsers();
	}, 60000);

	$('.live').on(UF.event_type, function() {
		$('.player').toggleClass('broadcasting');
	});


	$(".blog-wrapper").mCustomScrollbar({
    	axis:"y",
    	theme:"my-theme",
    	callbacks: {
    		onInit:function(){
    			console.log("init");
				loadPostBlog();
			},
			onTotalScroll:function(){
				console.log('end');
			}	
    	}
	});

	$(".archive-wrapper").mCustomScrollbar({
		axis:"y",
		theme:"my-theme",
		callbacks: {
			onInit:function(){
				loadAudioArchive();
			},
        	onTotalScroll:function(){
        		console.log('end');
        	}
		}
	});

	$('.audio').on(UF.event_type, function() {
		if (!$('.player-archive').length) {
			$('header').toggleClass('player-archive player-live');
		}
		$('.live').addClass('live-show');
	});

	$('.archive-audio').on(UF.event_type, function() {
		$('.archive-audio').removeClass('archive-audio-playing');
		$(this).addClass('archive-audio-playing');
	})

	$('.archive-form-search').keyup(function(){
		var search_val = $(".archive-form-search").find(".afs-input").val();
		console.log(search_val);
  		searchRecordsArchive(search_val);
	});

	$(".blog").on(UF.event_type, ".play-btn", function() {
  		$(this).toggleClass('stop');
	});

	$('.archive').on(UF.event_type, '.archive-audio', function() {
		var audio_source = UF.audio.find('source');
		audio_source.attr('src', $(this).find('.audio-info').attr('data-audio-url'));
		$('.player-progress').addClass('player-progress-active');
		togglePlayPause();
	});

	UF.player_progress.on(UF.event_type, function(e) {
		recordRewind(e);
	})

	$('.blog').on(UF.event_type, '.play-btn', function () {
		if ($(this).hasClass('stop')) {
			$(this).siblings('audio').trigger('play');
			console.log($(this));
		} else {
			$(this).siblings('audio').trigger('pause');	
		}
	});
    
    $('.nc-sub-item').on('click', function() {
        $('.nc-sub-item').removeClass('nc-sub-item-selected');
        $(this).addClass('nc-sub-item-selected');
    });


   	$('.afs-filter').click(function () {
   		$('.nav-calendar').slideToggle('slow');
  		$('.nav-calendar').toggleClass('nav-calendar-active');
  		$(this).toggleClass('afs-filter-open')
	});

	$('.fs-input').focusout(function () {
		$('.form-search').removeClass('active');
		$('.fs-btn').removeClass('search_active');
		$('.mCSB_container').css('margin-right', '30px');
	});
	
	$('.afs-input').focus(function() {
		$('.archive-form-search').addClass('archive-form-search-active');
	});

	$('.afs-input').focusout(function() {
		console.log("sdsd");
		$('.archive-form-search').removeClass('archive-form-search-active');
	});

	$('.blog').hover(
		function() {
			showScroll('#mCSB_1_scrollbar_vertical');
		},
		function() {
			hideScroll('#mCSB_1_scrollbar_vertical');
		}
	)
	$('.archive').hover(
		function() {
			showScroll('#mCSB_2_scrollbar_vertical');
		},
		function() {
			hideScroll('#mCSB_2_scrollbar_vertical');
		}
	)

	$("#slider" ).slider({
    	animate: true, 
        	     range: "min",
        	     value: 0.5,
        	     min: 0, 
        	     max: 1,
		         step: 0.01,
		         slide: function( event, ui ) {
            	   $('#audio').prop("volume", ui.value);
        	     }
	});

	function loadAudioArchive() {
    	var archive = $('.archive .archive-wrapper');
    	var view = {};
    	$.ajax({	
    		type: 'GET',
     		url: UF.api_ultima + '/played_songs.json?page[10]',
     		dataType: "json",
     		success: function (data) {
     			view = data || {};
       			view.convertUnixtime = function () {
					return function (timestamp, render) {
   						return convertUnixtime(timestamp, render);	
   					}
   				}
   				view.timeFormat = function () {
					return function (ms, render) {
   						return timeFormat(ms, render);	
   					}
   				}
   				$.get('../views/archive_audio.html', function(template){
					archive.html(Mustache.render(template, view));
  				});
     		}
		})	
	}

	loadPostBlog();
	loadAudioArchive();

    function loadPostBlog() {
    	var blog = $('.blog .mCSB_container'),
    	    view = {};
    	$.ajax({	
    		type: 'GET',
     		url: UF.api_ultima + '/posts.json',
     		dataType: "json",
     		success: function (data) {
     			view = data || {};
       			view.convertUnixtime = function () {
					return function (timestamp, render) {
   						return convertUnixtime(timestamp, render);	
   					}
   				}
   				$.get('../views/blog_post.html', function(template){
					blog.html(Mustache.render(template, view));
  				});
     		}
		})
    }

    function checkUpdateBlog () {
		// setInterval(function () {
		// 	$.ajax({	
	 //    		type: 'POST',
	 //     		url: 'wp-content/themes/ultima/search_new_post.php',
	 //     		dataType: "json",
	 //     		data: {"date_last_post" : date_last_post},
	 //     		success: function (resp) {

		//      		view = resp;
		//        		if (view.length != 0) {
		//        			console.log(view);
		//        			//$('.post:first').before("<div class='post'><li class='item'>Тест3</li></div>");
		//        			date_last_post = view[0].created_at;
		//        			view.convertUnixtime = function () {
		// 					return function (timestamp, render) {
		//    						return convertUnixtime(timestamp, render);	
		//    					}
		//    				}
		//        			//console.log(date_last_post);
		// 				getTemplate('wp-content/themes/ultima/templates/template.html');	
		// 			}
	 //     		}
		// 	})
		// }, 10000);
	}

	function searchRecordsArchive(search_val) {
			$.ajax({	
	    		type: 'GET',
	     		url:  UF.api_ultima + '/played_songs.json?filter[audio_artist_or_audio_title_cont]=' + search_val,
	     		dataType: "json",
	     		success: function (data) {
	     			// console.log(data);
	     		}
			});
	}

	function recordRewind(offset) {
		var x = offset.offsetX == undefined? offset.layerX : offset.offsetX,
  			percent = (x / UF.player_progress.width() * 100).toFixed(),
  			progressValRewind = $('.player-progress-val'),
  			lengthAudio = $(UF.audio).prop('duration');

  		progressValRewind.width(percent + '%');
  		(UF.audio).prop("currentTime", lengthAudio * percent / 100);	
	}

	function togglePlayPause() {
	   	if (UF.audio.prop("paused")) {
	   		UF.audio.trigger('load');
	   		UF.audio.trigger('play');
	   		showDuration();
			showBuffer();
	   		$('.player-btn').addClass('player-btn-pause');
	   	}
	   	else {	
	   		UF.audio.trigger('pause');
	   		$('.player-btn').removeClass("player-btn-pause");
	    }

		UF.audio.on('ended', function() {
			console.log('end');	
		});
  	}

    function playStopPlayer() {
        if (UF.player.state == 'play') {
            $("#audio").trigger('pause');
            UF.player.state = 'pause';
            $(this).removeClass('player-btn-pause');
            $('.player-progress').removeClass('player-progress-active');
        } else {
            $("#audio").trigger('load');
            $("#audio").trigger('play');
            UF.player.state = 'play';
            $(this).addClass('player-btn-pause');
            $('.player-progress').addClass('player-progress-active');
        }	
    }

    function showBuffer() {
    	UF.audio.on('progress', function() {
			var duration =  UF.audio.prop('duration'),
			    bufferedEnd = UF.audio.prop('buffered').end(0),
			    percent = (bufferedEnd / duration) * 100;
	
			if ((UF.audio.prop('buffered') != undefined) && (UF.audio.prop('buffered').length > 0)) {
			  $('.player-progress-buffer').css({ 'width' : percent + '%'});
			}
		});	
    }
   
    function showDuration() {
    	$(UF.audio).on('timeupdate', function() {
    		var sec = parseInt($(UF.audio).prop("currentTime") % 60),
		        min = parseInt($(UF.audio).prop("currentTime") / 60) % 60,
        	    percentage = 0;
			if (sec < 10) {
				sec = '0' + sec;
			}
			UF.audio_current_time.html(min + ':' + sec);
			if ($(UF.audio).prop("currentTime") > 0) {	
   				percentage = (100 / $(UF.audio).prop("duration")) * $(UF.audio).prop("currentTime");
			}
   			$('.player-progress-val').width(percentage + "%");
		});
	}
    	
		// function num(val){
  //       	val = Math.floor(val);
  //       	return val < 10 ? '0' + val : val;
  //   	}

	function timeFormat (ms, render) {
		function num(val){
        	val = Math.floor(val);
        	return val < 10 ? '0' + val : val;
    	}
    	var sec = ms / 1000, 
    		hours = sec / 3600 % 24, 
    		minutes = sec / 60 % 60, 
    		seconds = sec % 60;

    	return num(hours) + ":" + num(minutes) + ":" + num(seconds);
	}
    
    function convertUnixtime(timestamp, render) {
  		var d = new Date(render(timestamp) * 1000),
			yyyy = d.getFullYear(),
			mm = ('0' + (d.getMonth() + 1)).slice(-2),	
			dd = ('0' + d.getDate()).slice(-2),				
			time = dd + '.' + mm + '.' + yyyy;					
		return render(time);
    }

    function getTemplate(src_template, view) {
    	var html = '';
  		$.get(src_template, function(template){
  			html = Mustache.render(template, view);
  			//console.log(html);
  			return html;
  		});
	}

	// function renderingTemplate(template) {
 //  		var html = Mustache.render(template, UF.view);
 //  		return html;
	// }

	function getStatisticUsers() {
		$.getJSON(UF.api_ultima + '/stats', function(data) {
			$('.fs-online .fsi-val').html(data.current_listeners);
			$('.fs-peak .fsi-val').html(data.peak_listeners);
			$('.fs-today .fsi-val').html(data.unique_listeners);
			$('.fs-yesterday .fsi-val').html(data.prev_day_unique_listeners);
		})
	}

	function hideScroll (name_scroll) {
		$(name_scroll).css('opacity', '0');
	}

	function showScroll (name_scroll) {
		$(name_scroll).css('opacity', '1');
	}
    
    function protectEmail () {
    	var login  = 'zombie';
		var server = 'ultima.pro';
		var email  = login+'@'+server;
		var url = 'mailto:'+email;
		$('.mail').html('<a href="' + url + '">' + email + '</a>');	
    }
})


	
