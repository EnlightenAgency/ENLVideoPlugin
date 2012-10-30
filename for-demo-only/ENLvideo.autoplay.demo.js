/*-----------------------------------
ENLvideo.autoplay.js
Enlighten jQuery Video Plugin Add-on
v.0.1a - 05/30/2012

Documentation:    index.html
Examples:         demo.html
-----------------------------------*/

// AutoPlay Video on page load: requires ColorBox and always displays in a lightbox

/* DEBUG
    - Autoplay isn't working after the latest fix to iPad playback (placement function): video plays but isn't visible in the LightBox
*/

(function autoPlayVideo() {

    var getQueryVariable = function (variable) {
        var query = window.location.search.substring(1);
        query = query.replace("&amp;", ";AMP;")
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) {
                return pair[1];
            }
        }
        return "none";
    };

    //get querystring value for video name
    var vUrl = getQueryVariable('videoURL');
    var $a = $('a[href="' + vUrl + '"]').eq(0);
    var vWidth = getQueryVariable('videoWidth');
    var vHeight = getQueryVariable('videoHeight');
    var vDuration = getQueryVariable('videoDuration');

    var createAutoPlayVideoLink = function () {
        console.log("A video link was created!");
        return $("<a />").attr({
            href: vUrl,
            rel: 'videoparams::' + vWidth + '|' + vHeight + '|' + vDuration
        });
    };

    if (($a.length && vUrl != "none") || (vUrl != "none" && vWidth != "none" && vHeight != "none" && vDuration != "none")) {

        if ($a.length == 0) {
            $a = createAutoPlayVideoLink();
        }

        $a.ENLvideo({
            lightbox: true,
            hideVideoLink: false
        }).click();

    }

} ());