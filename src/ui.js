//-----------------------Renderer processes------------------------

//Module for Menu
const Menu = require("electron").remote.Menu;

function getMenu() {
    const menuTemplate = [

        {
            label: "File"
        },

        {
            label: "Edit"
        },

        {
            label: "View"
        },

        {
            label: "Test Widgets",
            submenu: [
                {
                    label: "Test Gyro",
                    click: testGyro
                },

                {
                    label: "Test Timer",
                    click: testTimer
                },

                {
                    label: "Check Camera Stream",
                    click: () => {
                        checkIfStreaming(ui.camera.srcs[ui.camera.id1], (streaming) => {
                            if (streaming) {
                                ui.toast({text: `Camera ${ui.camera.id1 + 1} is streaming`, duration: 5, type: "success"});
                            }
                            else {
                                ui.toast({text: `Camera ${ui.camera.id1 + 1} is not streaming`, duration: 5, type: "error"});
                            }
                        });
                    }
                }
            ]
        }

        /*{
            role: "configuration",
            label: "Configuration",
            submenu: [
                {
                    role: "loadConfig",
                    label: "Load Config",
                    click: () => {
                        config = Config.get();
                        //console.log(config);

                        //Add stuff to do with config here

                    }
                },
                {
                    role: "saveConfig",
                    label: "Save Config",
                    click: () => {
                        Config.setAll(config);
                    }
                },
                {
                    role: "clearConfig",
                    label: "Clear Config",
                    click: () => {
                        config.setAll({elements:[]});
                    }
                }
            ]
        }*/

    ];
    return menuTemplate;
}

//Module for custom titlebar/menu
const customTitlebar = require('custom-electron-titlebar');

/**
 * @type {customTitlebar.Titlebar}
 */
var titlebar;

titlebar = new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#444444'),
    icon: decodeURIComponent(__dirname).replace(/\\/g, "/").replace("/src", "/images/icon.png"),
    shadow: true,
    drag: true,
    minimizable: true,
    maximizable: true,
    closeable: true,
    titleHorizontalAlignment: "center",
    menuPosition: "left",
    menu: Menu.buildFromTemplate(getMenu())
});


//-------------------------------------Define UI elements----------------------------------------
let ui = {
    timer: document.getElementById('timer'),
    robotState: document.getElementById('robot-state').firstChild,
    gyro: {
        container: document.getElementById('gyro'),
        val: 0,
        offset: 0,
        visualVal: 0,
        arm: document.getElementById('gyro-arm'),
        number: document.getElementById('gyro-number')
    },
    robotDiagram: {
        arm: document.getElementById('robot-arm'),
        svg: document.getElementById('robot-diagram'),
        arm_placeholder: document.getElementById("robot-arm-placeholder"),
        rotationalsvg: document.getElementById("arm-rotational")
    },
    autoSelect: document.getElementById('auto-select'),
    armPosition: document.getElementById('arm-position'),
    toast: {},
    modal: {},
    sidebar: document.getElementById("sidebar"),
    sidebar_bar: document.getElementById("sidebar_bar"),
    login: {
        box: document.getElementById("connect-address"),
        button: document.getElementById("connect")
    },
    widgets: {}
};


//Add toast function:
ui.toast = toast;

//Add modal function:
ui.modal = function({title, text, type}) {
    ipc.send("addModal", {title: title, text: text, type: type});
}

// Key Listeners

// Gyro rotation
/*let updateGyro = (key, value) => {
    ui.gyro.val = value;
    ui.gyro.visualVal = Math.floor(ui.gyro.val - ui.gyro.offset);
    ui.gyro.visualVal %= 360;
    if (ui.gyro.visualVal < 0) {
        ui.gyro.visualVal += 360;
    }
    ui.gyro.arm.style.transform = `rotate(${ui.gyro.visualVal}deg)`;
    ui.gyro.arm.style.transformOrigin = `50% 50%`;
    ui.gyro.number.textContent = ui.gyro.visualVal + 'º';
};
NetworkTables.addKeyListener('/SmartDashboard/Gyro', updateGyro);*/

// The following case is an example, for a robot with an arm at the front.
/*NetworkTables.addKeyListener('/SmartDashboard/arm/encoder', (key, value) => {
    // 0 is all the way back, 1200 is 45 degrees forward. We don't want it going past that.
    if (value > 1200) {
        value = 1200;
    }
    else if (value < 0) {
        value = 0;
    }
    // Calculate visual rotation of arm
    //var armAngle = value * 3 / 20 - 45;
    
    //var armAngle = (value * 3 / 8) + 180; - My formula
    var armAngle = (value / 1200 * 45) + 180;

    // Rotate the arm in diagram to match real arm
    ui.robotDiagram.rotationalsvg.style.transformOrigin = `50% 50%`;
    ui.robotDiagram.rotationalsvg.style.transform = `rotate(${armAngle}deg)`;
});*/

//Set robot arm to initial position
//ui.robotDiagram.rotationalsvg.style.transformOrigin = `50% 50%`;
//ui.robotDiagram.rotationalsvg.style.transform = `rotate(180deg)`;

var isRed = false;
var isComplete = false;

NetworkTables.addKeyListener('/robot/time', (key, value) => {
    // This is an example of how a dashboard could display the remaining time in a match.
    // We assume here that value is an integer representing the number of seconds left.

    var minutes =  Math.floor(value / 60);
    var seconds = (value % 60 < 10 ? '0' : '') + value % 60;

    ui.timer.textContent = value < 0 ? '0:00' : minutes + ':' + seconds;

    if (minutes == 0 && !isNaN(seconds) && Number(seconds) <= 30) {
        //Red flashing text animation
        if (isRed) $(ui.timer).css("color", "white");
        else $(ui.timer).css("color", "red");

        isRed = !isRed;
    }
    if (seconds == 0 && minutes == 0 && !isComplete) {
        ui.toast({text: "Match Complete", duration: 3, type: "warning"});
        isComplete = true;
    }
    else if (Number(minutes) >= 2) {
        isComplete = false;
        $(ui.timer).css("color", "white");
    }
});

// Load list of prewritten autonomous modes
NetworkTables.addKeyListener('/SmartDashboard/autonomous/modes', (key, value) => {
    // Clear previous list
    while (ui.autoSelect.firstChild) {
        ui.autoSelect.removeChild(ui.autoSelect.firstChild);
    }
    // Make an option for each autonomous mode and put it in the selector
    for (let i = 0; i < value.length; i++) {
        var option = document.createElement('option');
        option.appendChild(document.createTextNode(value[i]));
        ui.autoSelect.appendChild(option);
    }
    // Set value to the already-selected mode. If there is none, nothing will happen.
    ui.autoSelect.value = NetworkTables.getValue('/SmartDashboard/currentlySelectedMode');
});

// Load list of prewritten autonomous modes
NetworkTables.addKeyListener('/SmartDashboard/autonomous/selected', (key, value) => {
    ui.autoSelect.value = value;
});


// Reset gyro value to 0 on click
/*ui.gyro.container.onclick = function () {
    // Store previous gyro val, will now be subtracted from val for callibration
    ui.gyro.offset = ui.gyro.val;
    // Trigger the gyro to recalculate value.
    updateGyro('/SmartDashboard/drive/navx/yaw', ui.gyro.val);
    ui.toast({text: "Reset Gyro.", duration: 3, type: "success"});
};*/
// Update NetworkTables when autonomous selector is changed
//ui.autoSelect.onchange = function () {
//    NetworkTables.putValue('/SmartDashboard/autonomous/selected', this.value);
//};
// Get value of arm height slider when it's adjusted
//ui.armPosition.oninput = function () {
//    NetworkTables.putValue('/SmartDashboard/arm/encoder', parseInt(this.value));
//};

addEventListener('error', (ev) => {
    ipc.send('windowError', { mesg: ev.message, file: ev.filename, lineNumber: ev.lineno })
})


var sidebarIsOpen = false;

ui.sidebar_bar.onclick = function () {
    if (!sidebarIsOpen) {
        //Opens the sidebar
        document.getElementById("sidebar").style.width = "500px";
        document.getElementById("sidebar_bar").innerHTML = "&#9668;";
        document.getElementById("sidebar_content").style.opacity = 1;
        document.getElementById("sidebar_content").style.display = "block";
        sidebarIsOpen = true;
    }
    else {
        //Closes the sidebar
        document.getElementById("sidebar").style.width = "16px";
        document.getElementById("sidebar_bar").innerHTML = "&#9658;";
        document.getElementById("sidebar_content").style.opacity = 0;
        sidebarIsOpen = false;
    }
}

/*ui.team.logoElement.onclick = () => {
    ui.modal({title: `Team ${ui.team.number}`, text: `Team ${ui.team.number}, ${ui.team.name}.<br>Homepage: ${ui.team.link + "#" + ui.team.number}`, type: "info"});
}*/

/*setTimeout(() => {
    ui.login.box.value = ui.login.box.value.replace("xxxx", ui.team.number);
    ui.login.box.setSelectionRange(8, 8 + ui.team.number.toString().length);

    if (ui.team.inDevMode) {
        ui.login.box.value = "localhost";
        ui.login.button.innerHTML = "Connect (Dev Mode)";
    }
}, 100);*/

/*if (ui.team.inDevMode) {
    setTimeout(() => {
        document.getElementsByClassName("titlebar")[0].style.transition = "7s ease all";
        document.getElementsByClassName("titlebar")[0].style.color = "gold";
        document.getElementsByClassName("window-icon")[0].style.backgroundColor = "gold";
        document.getElementsByClassName("window-icon")[1].style.backgroundColor = "gold";
        document.getElementsByClassName("window-icon")[2].style.backgroundColor = "gold";
    }, 2000);
}*/

//--------------------------------------HBS Widgets-------------------------------------------\\

// TITLE/INFO LABELS :
function Label(text, type) {

    var elem = `<div class="label-${type}"><p>${text}</p></div>`;
    this.lastParent = null;

    this.insertTo = (parent) => {
        this.lastParent = parent;
        var container = $(parent).find(".label_container")[0];
        container.innerHTML = elem;
        $(parent).css("height", (Number($(parent).css("height").replace("px", "")) + 40 + Number($(parent).css("padding").replace("px", ""))) + "px");
        return this;
    }

    this.updateIn = (parent, heightChange) => {
        this.lastParent = parent;
            if ($(parent + " .label-" + type).length > 0) {
                $(parent + " .label-" + type).html("<p>" + text + "</p>");
            }
            else {
                $(parent)[0].innerHTML += elem;
            }
        if (heightChange) $(parent).css("height", (Number($(parent).css("height").replace("px", "")) + 40 + Number($(parent).css("padding").replace("px", ""))) + "px");
        return this;
    }

    this.addLabel = (label) => {
        $(this.lastParent).find(".label_container")[0].innerHTML += label.toString();
        return this;
    }

    this.toString = () => {
        return elem;
    }

}

//Initialize label title of Gyro
new Label("Gyro", "title").insertTo("#gyro");
new Label(`0º`, "info").updateIn("#gyro", false);

//Gyro method:
ui.widgets.updateGyro = (parentID, value) => {

    console.log("Update Gyro", value);
    console.log(parentID);
    ui.gyro.val = value;
    ui.gyro.visualVal = Math.floor(ui.gyro.val - ui.gyro.offset);
    ui.gyro.visualVal %= 360;
    if (ui.gyro.visualVal < 0) {
        ui.gyro.visualVal += 360;
    }

    $(`#${parentID} .gyro-img #path9631`).css({'transform-box': 'fill-box', 'transform-origin': 'center', 'transform': `rotate(${ui.gyro.visualVal}deg)`});

    var degrees = new Label(`${ui.gyro.visualVal}º`, "info").updateIn(`#${parentID}`, false);

}

//---

//Create the title label for auton modes
new Label("Autonomous Modes", "title").insertTo("#auton_modes");

//Autonomous Modes method:
ui.widgets.autonModes = () => {


}

//Create the title label for the motors
new Label("Motors", "title").insertTo("#motors_widget")

//Motors' Status method:
ui.widgets.updateMotors = () => {

}

//Create title label for values:
new Label("Values", "title").insertTo("#values_box");

ui.widgets.updateValues = () => {







































    
}