// Set a global alias for the camera and related elements.
ui.camera = {
    viewer1: document.getElementById('camera'),
    button: "",
    id1: 0,
	srcs: [ // Will default to first camera
        'http://localhost:1181/?action=stream',
        'http://roborio-245-frc.local:1181/?action=stream',
        'http://localhost:1183/?action=stream'
    ],
    isStreaming: false
};

// Unlike most addons, this addon doesn't interact with NetworkTables. Therefore, we won't need to add any NT listeners.

$(ui.camera.viewer1).html(`<div id="camera-bar"><p>Camera 1</p><button>Toggle</button></div>`);

function checkIfStreaming(src, callback) {
    var elem = $(document.createElement("img")).attr("src", src).addClass("camera-preload");

    elem.appendTo($(document.body));

    var events = ["load", "error"];

    events.forEach(function(ev){
    elem[0].addEventListener(ev, function(){
      elem.detach();
      if (ev == "error") {
        return callback(false);
      }
      else {
        return callback(true);
      }
    });
    });
}

// When camera is clicked on, change to the next source.
let cameraListener = () => {
    ui.camera.button = document.querySelector("#camera button");
    ui.camera.button.onclick = function() {
        ui.camera.id1 += 1;
        if (ui.camera.id1 === ui.camera.srcs.length) ui.camera.id1 = 0;
        if (ui.camera.isStreaming) {
            ui.camera.viewer1.style.backgroundImage = 'url(' + ui.camera.srcs[ui.camera.id1] + ')';
            $(ui.camera.viewer1).html(`<div id="camera-bar"><p>Camera ${ui.camera.id1 + 1}</p><button>Toggle</button></div>`);
            ui.camera.button = document.querySelector("#camera button");
            cameraListener();
        }
        else {
            ui.toast({text: `Checking if Camera ${ui.camera.id1 + 1} is streaming...`, duration: 2, type: "info"});
            checkIfStreaming(ui.camera.srcs[ui.camera.id1], (streaming) => {
                if (streaming) {
                    ui.camera.viewer1.style.backgroundImage = 'url(' + ui.camera.srcs[ui.camera.id1] + ')';
                    $(ui.camera.viewer1).html(`<div id="camera-bar"><p>Camera ${ui.camera.id1 + 1}</p><button>Toggle</button></div>`);
                    ui.camera.isStreaming = true;
                }
                else {
                    ui.toast({text: `Camera ${ui.camera.id1 + 1} is not streaming`, duration: 5, type: "error"});
                    $(ui.camera.viewer1).html(`<div id="camera-bar"><p>Camera ${ui.camera.id1 + 1} <span class='error'>(Failed to Load)</span></p><button>Toggle</button></div>`);
                }
                ui.camera.button = document.querySelector("#camera button");
                cameraListener();
            });
        }
    };
}



//Initialize cameras to correct initial streams:
checkIfStreaming(ui.camera.srcs[ui.camera.id1], (streaming) => {
    if (streaming) {
        ui.camera.viewer1.style.backgroundImage = 'url(' + ui.camera.srcs[ui.camera.id1] + ')';
        ui.camera.isStreaming = true;
    }
    else {
        ui.toast({text: `Camera ${ui.camera.id1 + 1} is not streaming`, duration: 5, type: "error"});
        $(ui.camera.viewer1).html(`<div id="camera-bar"><p>Camera 1 <span class='error'>(Failed to Load)</span></p><button>Toggle</button></div>`);
    }
    setTimeout(cameraListener, 1000);
});