/*-------------------------------
  ENLvideo.js
  Enlighten jQuery Video Plugin
  v.0.9 - 09/05/2012

  Documentation:    index.html
  Examples:         demo.html
-------------------------------*/

(function ($) {
    $.fn.extend({
        ENLvideo: function (options, callback) {

            var defaults = {    // See Documentation at index.html for more detailed description of options

                // Necessary Element Classes/IDs
                videoContainerClass: "videoHolder", 
                videoLinkClass: "videoLink", 
                vidDivID: "vidDiv",

                // Other options
                openVideoElsewhere: false,
                applyContainerWidth: false,

                // Custom HTML5 Controls
                customControls: false,
                customControlsTheme: 'customVidControls',
                customControlsOnHover: false,
                volumeSliderOrientation: 'vertical',

                // Flash
                flashVersion: "9.0.115",
                flashPrefix: "../flash/",
                flashWmode: "opaque",
                playerURL: "FlashVideoPlayer_scale.swf",
                flashVideoPrefix: "../",

                // Dimensions, etc.
                flashPlayerControlHeight: 22,
                videoWidth: 640,   // 16:9
                videoHeight: 360,  // 16:9
                videoDuration: 9999,

                // No Flash Message and Link
                nonflashVideoContentPart1: "To see this video you need JavaScript enabled and the latest version of Flash.\nYou can also use a browser that supports H.264 HTML5 Video options.",
                nonflashVideoContentPart2LinkText: "Click here to download Flash",
                nonflashVideoContentPart2LinkUrl: "http://www.adobe.com/go/getflashplayer",
                nonflashVideoContentPart2Text: " from the Adobe download center.",

                // Open video in LightBox
                lightbox: false,
                lightboxOverlayOpacity: 0.85,

                // Hide the video link text and posterImg when the video plays
                hideVideoLink: true,

                // Callback function that runs on click, before playing the video
                callback: function () { }

            };

            if (typeof callback == 'function') { callback.call(this); }

            var options = $.extend(defaults, options),
                oVideoLinkClass = "." + options.videoLinkClass,         // Lets you set the options without the preceding "."
                oVideoContainerClass = "." + options.videoContainerClass,
                oAutoPlayVideoLinkClass = "." + options.autoPlayVideoLinkClass,
                dimChanged = false,
                flashVideoPlayerURL = options.flashPrefix + options.playerURL,
                
            //--------------------------------------------------------------------------------------------------------- DETECT SUPPORT
            
            detectAndroid = function() {
                var Android = ['android'];
                var userAgent = navigator.userAgent.toLowerCase();
                for (var i = 0; i < Android.length; i++) {
                    if (userAgent.indexOf(Android[i]) != -1) {
                        return true;
                    }
                }
                return false;
            },
                
            supports_html5_h264_video = function() {
                //if Android, return true
                if (detectAndroid()) { return true; }
                //if browser can't play video tag at all (IE), return false:
                if (!document.createElement('video').canPlayType) { return false; }
                //if it can, check for mp4 type:
                else {
                    var v = document.createElement("video");
                    return !!v.canPlayType('video/mp4');
                }    
            },

            //--------------------------------------------------------------------------------------------------------- PLAY VIDEO

            playVideo = function ($thisLink, vidDivID, posterImg) {
                var videoURLForFlashPlayer = $thisLink.attr("href");

                if ($thisLink.attr("href") === "") { return false; }

                options.videoWidth = parseInt(options.videoWidth, 10);
                options.videoHeight = parseInt(options.videoHeight, 10);
                
                // LIGHTBOX
                if (options.lightbox) {

                    // Check if video is larger than the viewport, if so, resize video proportionally to fit
                    var viewportY = $(window).height();
                    var viewportX = $(window).width();

                    if (options.videoWidth + 20 > viewportX || options.videoHeight + 20 > viewportY) {
                        dimChanged = true;
                        var vidPorportions = options.videoWidth / options.videoHeight;
                        var orgW = options.videoWidth;
                        var orgH = options.videoHeight;
                        if (options.videoHeight + 20 > viewportY) {
                            options.videoHeight = viewportY * 0.75;
                            options.videoWidth = orgW > orgH ? options.videoHeight * vidPorportions : options.videoHeight / vidPorportions;
                            if (options.videoWidth + 20 > viewportX) {
                                options.videoWidth = viewportX * 0.75;
                                options.videoHeight = orgW > orgH ? options.videoWidth / vidPorportions : options.videoWidth * vidPorportions;
                            }
                        } else {
                            options.videoWidth = viewportX * 0.75;
                            options.videoHeight = orgW > orgH ? options.videoWidth / vidPorportions : options.videoWidth * vidPorportions;
                            if (options.videoHeight + 20 > viewportY) {
                                options.videoHeight = viewportY * 0.75;
                                options.videoWidth = orgW > orgH ? options.videoHeight * vidPorportions : options.videoHeight / vidPorportions;
                            }
                        }
                    }

                    // Create player width and height variables based on the results of the resize code
                    var playerWidth = options.videoWidth;
                    var playerHeight = (supports_html5_h264_video) ? options.videoHeight : options.videoHeight + options.flashPlayerControlHeight;

                    // Get div if exists, create if it doesn't
                    placeVideoDiv(vidDivID, $thisLink);

                    // This is if it's a <video> inside a container, otherwise it's a flash object
                    var $videoContainerDiv = $(vidDivID);
                    
                    if (!dimChanged) {  // dimChanged = false | Current browser dimensions are sufficient for the video

                        // Open lightbox to display
                        $.fn.colorbox({
                            innerWidth: playerWidth,
                            innerHeight: playerHeight,
                            inline: true,
                            href: vidDivID,
                            onOpen: function () {
                                $(document).trigger("lightboxOpen", [$thisLink]); // Custom event
                            },
                            onComplete: function () {
                                createVideoObject(vidDivID, $thisLink, options.videoWidth, options.videoHeight, options.videoDuration, playerWidth, playerHeight, $videoContainerDiv);
                                $(document).trigger("lightboxComplete", [$thisLink]); // Custom event
                            },
                            onCleanup: function () {
                                $(document).trigger("lightboxCleanup", [$thisLink]); // Custom event
                                // This is the container div OR the swf object, depending on what was created
                                $(vidDivID).hide();
                            },
                            onClosed: function () {
                                $(vidDivID).remove();
                                $(document).trigger("lightboxClosed", [$thisLink]); // Custom event
                            },
                            opacity: options.lightboxOverlayOpacity
                        });

                    } else {  // dimChanged = true | Video has been resized to accommodate smaller browser dimensions

                        // Open lightbox to display
                        $.fn.colorbox({
                            innerWidth: playerWidth,
                            innerHeight: playerHeight,
                            inline: true,
                            href: vidDivID,
                            onOpen: function () {
                                $(document).trigger("lightboxOpen", [$thisLink]); // Custom event
                            },
                            onComplete: function () { 
                                createVideoObject(vidDivID, $thisLink, options.videoWidth, options.videoHeight, options.videoDuration, playerWidth, playerHeight, $videoContainerDiv);
                                $(document).trigger("lightboxComplete", [$thisLink]); // Custom event
                            },
                            onCleanup: function () {
                                $(document).trigger("lightboxCleanup", [$thisLink]); // Custom event
                                // This is the container div OR the swf object, depending on what was created
                                $(vidDivID).hide();    
                            },
                            onClosed: function () {
                                $(vidDivID).remove();
                                $(document).trigger("lightboxClosed", [$thisLink]); // Custom event
                            },
                            opacity: options.lightboxOverlayOpacity
                        });
                    }

                // EMBEDDED VIDEO: NO LIGHTBOX
                } else {

                    // Get div if exists, create if it doesn't
                    placeVideoDiv(vidDivID, $thisLink);

                    // apply the video width to its containing element if specified
                    if (options.applyContainerWidth) {
                        $(oVideoContainerClass).parent().width(options.videoWidth);
                    }

                    createVideoObject(vidDivID, $thisLink, options.videoWidth, options.videoHeight, options.videoDuration, options.videoWidth, options.videoHeight + options.flashPlayerControlHeight, posterImg);
                }

                // This is for after the video is embedded, making it re-playable
                if (detectAndroid()) {
                    $("video").live("click", function () {
                        this.play();
                    });
                }
            },

            //--------------------------------------------------------------------------------------------------------- CREATE VIDEO DIV

            createVideoDiv = function (vidDivID) {
                var $videoContainerDiv = $("<div />").attr({ id: vidDivID.replace("#", "") });

                // Create noflash div and insert
                var noflashDiv = $("<div />").addClass("noFlash");
                var noflashP1 = $("<p />").text(options.nonflashVideoContentPart1);
                var noflashP2link = $("<a />").attr({ href: options.nonflashVideoContentPart2LinkUrl, target: "_blank" }).text(options.nonflashVideoContentPart2LinkText);
                var noflashP2 = $("<p />").text(options.nonflashVideoContentPart2Text);
                noflashP2.prepend(noflashP2link);
                noflashDiv.append(noflashP1).append(noflashP2);
                $videoContainerDiv.append(noflashDiv);

                return $videoContainerDiv;
            },

            //--------------------------------------------------------------------------------------------------------- ADD VIDEO DIV WHERE IT BELONGS

            placeVideoDiv = function(vidDivID, $thisLink) {
                var $vidDiv = $(vidDivID).length ? $(vidDivID) : createVideoDiv(vidDivID);

                // If the video is being opened in a different location than the link
                if (options.openVideoElsewhere) {

                    // If there is a previously-opened video in the target containing element, remove it before adding the next one
                    var $prevOpenedVid = $(oVideoContainerClass + " > [id^=" + options.vidDivID + "]");
                    if ($prevOpenedVid.length) {
                        $prevOpenedVid.remove();
                    }

                    $(document.body).find(oVideoContainerClass).append($vidDiv);

                // Video opens in same location as link: container exists somewhere on the page (same-container embeds and lightbox)
                } else if ($thisLink.closest(oVideoContainerClass).length) {    
                    $thisLink.closest(oVideoContainerClass).append($vidDiv);

                // Container doesn't exist; create it and hide it: for autoplay lightboxes only
                } else {    

                    var $vidDiv = createVideoDiv(vidDivID);

                    if ($(oVideoContainerClass).length) {   // Check if the container exists, if so, append video div
                        $(oVideoContainerClass).first().append($vidDiv);
                    } else {
                        $(document.body)
                        .append($('<div />')
                        .addClass(options.videoContainerClass)
                        .css('display', 'none')
                        .append($vidDiv));
                    }
                }
            },

            //--------------------------------------------------------------------------------------------------------- CREATE VIDEO OBJECT

            createVideoObject = function (vidDivID, $thisLink, vidWidth, vidHeight, vidDuration, playerWidth, playerHeight, posterImg) {

                var $vidDiv = $(vidDivID);

                if (supports_html5_h264_video()) {
                    // EMBED HTML5 Video Player
                    // NOTE that iPhone OS2 does not support HTML5 Video

                    var videoattributes = {};
                    videoattributes.src = $thisLink.attr("href");
                    videoattributes.width = vidWidth;
                    videoattributes.height = vidHeight;
                    videoattributes.controls = "true";
                    videoattributes.autoplay = "autoplay";

                    var video = $("<video />").attr(videoattributes);

                    // Appends the video to the container div
                    $vidDiv.html(video);

                    // Create a variable referring to the <video> DOM object
                    var videoDOMobject = video.get(0),
                        $videoObj = video;

            //-------------------- HTML5 Player Custom Controls

                    if (options.customControls) {

                        var $customControlsDiv = $('<div />').addClass('vidControls').addClass(options.customControlsTheme),
                            $playPause = $('<a />').addClass('uiPlayPause').attr('title', 'Play/Pause'),
                            $seek = $('<div />').addClass('uiSeek'),
                            $timer = $('<div />').addClass('uiTimer').html('00:00'),
                            $volContainer = $('<div />').addClass('uiVolContainer'),
                            $volSlider = $('<div />').addClass('uiVolSlider'),
                            $volBtn = $('<div />').addClass('uiVolBtn');

                        $vidDiv.append($customControlsDiv);
                        $customControlsDiv.append($playPause).append($seek).append($timer).append($volContainer);
                        $volContainer.append($volSlider).append($volBtn);

                        var $vidControls = $vidDiv.find('.vidControls'),
                            $uiPlayPause = $vidDiv.find('.uiPlayPause'),
                            $uiSeek = $vidDiv.find('.uiSeek'),
                            $uiTimer = $vidDiv.find('.uiTimer'),
                            $uiVolContainer = $vidDiv.find('.uiVolContainer'),
                            $uiVolSlider = $vidDiv.find('.uiVolSlider'),
                            $uiVolBtn = $vidDiv.find('.uiVolBtn');

                        $vidControls.hide();

                        var cPlay = function() {
                                if (videoDOMobject.paused === false) {
                                    videoDOMobject.pause();
                                } else {
                                    videoDOMobject.play();
                                }
                            };

                        $uiPlayPause.on('click', cPlay);
                        $videoObj.on('click', cPlay);

                        $videoObj.on('play', function() {
                            $uiPlayPause.addClass('pausedBtn');
                        });

                        $videoObj.on('pause', function() {
                            $uiPlayPause.removeClass('pausedBtn');
                        });

                        $videoObj.on('ended', function() {
                            $uiPlayPause.removeClass('pausedBtn');
                        });

                        var createSeek = function() {
                                if (videoDOMobject.readyState > 0) {
                                    var videoDuration = videoDOMobject.duration;

                                    $uiSeek.slider({
                                        value: 0,
                                        step: 0.01,
                                        orientation: 'horizontal',
                                        range: 'min',
                                        max: videoDuration,
                                        animate: true,
                                        slide: function(e, ui) {
                                            videoDOMobject.currentTime = ui.value;
                                        },
                                        stop: function(e, ui) {
                                            videoDOMobject.currentTime = ui.value;
                                        }
                                    });

                                    $vidControls.show(); 

                                    if (options.customControlsOnHover) {
                                        $vidDiv.on('mouseenter', function() {
                                            $vidControls.css('visibility', 'visible').fadeTo(350, 1);
                                        }).on('mouseleave', function() {
                                            $vidControls.fadeTo(350, 0, function() {
                                                $(this).css('visibility', 'hidden');
                                            });
                                        });
                                    } 

                                } else {
                                    setTimeout(createSeek, 150);
                                }
                            };
                        
                        createSeek();

                        var timeFormat = function(seconds) {
                                var m = (Math.floor(seconds/60) < 10) ? '0' + Math.floor(seconds/60) : Math.floor(seconds/60),
                                    s = (Math.floor(seconds-(m*60)) < 10) ? '0' + Math.floor(seconds-(m*60)) : Math.floor(seconds-(m*60));
                                return m + ':' + s;
                            },

                            seekUpdate = function() {
                                var currentTime = videoDOMobject.currentTime;
                                $uiSeek.slider('value', currentTime); 
                                $uiTimer.text(timeFormat(currentTime));
                            };

                        $videoObj.on('timeupdate', seekUpdate);

                        var videoVolume = 100;

                        $uiVolSlider.slider({
                            value: 1,
                            orientation: options.volumeSliderOrientation,
                            range: 'min',
                            max: 1,
                            step: 0.05,
                            animate: true,
                            slide: function(e, ui) {
                                videoDOMobject.muted = false;
                                videoVolume = ui.value;
                                videoDOMobject.volume = ui.value;
                            }
                        });

                        var muteVolume = function() {
                                if (videoDOMobject.muted) {
                                    videoDOMobject.muted = false;
                                    $uiVolSlider.slider('value', videoVolume);
                                    $uiVolContainer.removeClass('muted');
                                    $uiVolBtn.removeClass('volumeMute');
                                } else {
                                    videoDOMobject.muted = true;
                                    $uiVolSlider.slider('value', '0');
                                    $uiVolContainer.addClass('muted');
                                    $uiVolBtn.addClass('volumeMute');
                                }
                            };

                        $uiVolBtn.on('click', muteVolume);
                        $videoObj.removeAttr('controls');
                    }

            //-------------------- END HTML5 Player Custom Controls

                    // iOS and Android 3.0 and higher
                    videoDOMobject.play();

                    // Android 2.2 and under
                    setTimeout(function () { videoDOMobject.play(); }, 50);

                    // Add tracking to video play
                    video.on("timeupdate", trackVideoTime);

                } else if (swfobject.hasFlashPlayerVersion(options.flashVersion)) {
                    // EMBED SWFObject Flash Player
                    var flashvars = {};
                    flashvars.videoUrl = options.flashVideoPrefix + $thisLink.attr("href");
                    flashvars.videoWidth = vidWidth;
                    flashvars.videoHeight = vidHeight;
                    flashvars.videoDuration = vidDuration;

                    var flashparams = {};
                    flashparams.menu = "false";
                    flashparams.scalemode = "noscale";
                    flashparams.quality = "high";
                    flashparams.wmode = options.flashWmode;
                    flashparams.bgcolor = "#3E3C3C";

                    var flashattributes = {};

                    swfobject.embedSWF(flashVideoPlayerURL, vidDivID.replace("#", ""), playerWidth, playerHeight, options.flashVersion, null, flashvars, flashparams, flashattributes);
                }
            },

            //--------------------------------------------------------------------------------------------------------- TRACKING

            videoProgress,
            checkVideoCompletion,

            trackVideoTime = function () {
                var curTime = this.currentTime.toFixed(0);
                var vidLength = this.duration.toFixed(0);
                var curPercent = ((curTime / vidLength) * 100).toFixed(0);
                var eventType = "VideoProgress_";
                var videoURL = this.src;
                var video = this;
                var sendVideoTrack = function(eventType) {
                    goToPage('VideoPlayerEvent/' + eventType + '/' + videoURL + '/', video);
                    // Custom events for video tracking
                    // $(document).trigger(eventType, [video]);
                };

                // TODO: add option for frequency of tracking and refactor the following to eliminate the if/else chain
                if (videoProgress < 90 && curPercent > 90) {
                    videoProgress = 90;
                    sendVideoTrack(eventType + videoProgress);
                }
                else if (videoProgress < 87.5 && curPercent > 87.5) {
                    videoProgress = 87.5;
                    sendVideoTrack(eventType + videoProgress);
                }
                else if (videoProgress < 75 && curPercent > 75) {
                    videoProgress = 75;
                    sendVideoTrack(eventType + videoProgress);
                }
                else if (videoProgress < 62.5 && curPercent > 62.5) {
                    videoProgress = 62.5;
                    sendVideoTrack(eventType + videoProgress);
                }
                else if (videoProgress < 50 && curPercent > 50) {
                    videoProgress = 50;
                    sendVideoTrack(eventType + videoProgress);
                }
                else if (videoProgress < 37.5 && curPercent > 37.5) {
                    videoProgress = 37.5;
                    sendVideoTrack(eventType + videoProgress);
                }
                else if (videoProgress < 25 && curPercent > 25) {
                    videoProgress = 25;
                    sendVideoTrack(eventType + videoProgress);
                }
                else if (videoProgress < 12.5 && curPercent > 12.5) {
                    videoProgress = 12.5;
                    sendVideoTrack(eventType + videoProgress);
                }
                else if (videoProgress < 2 && curPercent > 1) {
                    videoProgress = 2;
                    sendVideoTrack("VideoStart");
                }
                else if (videoProgress < 1 && curPercent <= 25) {
                    videoProgress = 1;
                    sendVideoTrack("VideoLoad");
                }

                if (this.duration - this.currentTime <= 0.25) {
                    clearTimeout(checkVideoCompletion);
                    checkVideoCompletion = setTimeout(function () {
                        sendVideoTrack("VideoEnded");
                    }, 300);
                }
            };

            /* window.riaTrack = function(trackingParam) {
                goToPage(trackingParam);
            }; */

            window.goToPage = function(pg, video) {
                var rex = /VideoPlayerEvent\/.*?\//,
                    rex2 = /\/\w+/,
                    eventType = rex2.exec(rex.exec(pg)[0])[0].replace('/', '');

                dcsMultiTrack('DCS.dcsuri', pg, 'DCS.dcsqry', '', 'WT.ti', pg);
                firstTracker._trackPageview(pg);

                // Custom events for video tracking
                $(document).trigger(eventType, [video]);
            };

            //--------------------------------------------------------------------------------------------------------- EACH

            return this.each(function () {

                var pluginApplied = $(this).data("pluginApplied");

                if (!pluginApplied) {   // If the plugin hasn't previously been applied, apply it

                    $(this).data("pluginApplied", true);

                    $(this).click(function (e) {    // Click the link to the video

                        e.preventDefault();

                        // Optional custom callback function
                        options.callback.call(this);

                        var vidDivID = "#" + options.vidDivID + new Date().getTime();   // Ensures that the created div ID will always be unique
                        var $this = $(this);
                        var videoLinkRel = $this.attr("rel");
                        var vidParams = [];
                        var posterImg = $(this).find("img").attr("src");

                        $(document).trigger('ENLvideoInit', [vidDivID, $this]);

                        // This hides the current link when it's clicked to show the video
                        if (options.hideVideoLink) {
                            $this.hide();
                        }

                        if (videoLinkRel) {
                            vidParams = videoLinkRel.split("::")[1].split("|");
                            options.videoWidth = vidParams[0];
                            options.videoHeight = vidParams[1];
                            options.videoDuration = vidParams[2];
                        }

                        // playVideo(videoURL, vidDivID, posterImg)
                        playVideo($this, vidDivID, posterImg);
                        
                    });

                }

            }); // end .each method
        }   // end plugin function
    }); // end extend

    // end plugin    
})(jQuery);