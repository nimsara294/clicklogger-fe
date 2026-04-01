/* eslint-disable eqeqeq, no-unused-vars, react-hooks/exhaustive-deps, default-case */
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

export default function App() {

  // ─── Variables (mirroring original globals) ───────────────────────────────

  var totalTouchDuration = useRef(0);
  var tapCounter = useRef(0);
  var startTap = useRef(0);
  var endTap = useRef(0);
  var tapSessionStartTime = useRef(0);
  var tapLog = useRef("");
  var tapLogsArray = useRef([]);

  // stop after 50 taps or 60 seconds, whichever occurs first
  var tapLimit = 50;
  var tapTimeOut = 60; // seconds
  var uniqueIdentifier = useRef(0);
  var d = useRef(null);
  var dependentVariable = useRef("");

  var showFeedback = useRef(false);
  var interfaceVariations = 2;
  var interfaceSequence = useRef(1);

  // ─── React state for UI rendering ────────────────────────────────────────
  const [showButtonContainer, setShowButtonContainer] = useState(true);
  const [showContainer, setShowContainer] = useState(false);
  const [showTapHere, setShowTapHere] = useState(true);
  const [showContinue, setShowContinue] = useState(false);
  const [counterHTML, setCounterHTML] = useState("");
  const [actionHTML, setActionHTML] = useState("");

  const tapHereRef = useRef(null);

  // Called when page finishes loading
  useEffect(() => {
    onLoad();
  }, []);

  // tapityTap defined before the useEffect that attaches it
  // useCallback with empty deps — only reads from refs, never from state
  const tapityTap = useCallback((tep) => {

    //var el = document.getElementById("tapHere");
    d.current = new Date();

    //var n = d.getTime();

    var te = tep.type;

    // document.getElementById("action").innerHTML = te;
    setActionHTML(te);

    console.log("Ready:" + te);
    //document.getElementById("tapHere").innerHTML = "I am listening: "+te;

    switch (te) {

      case "touchstart":
        tep.preventDefault();
      // falls through
      case "mousedown":
        startTap.current = d.current.getTime();
        if (tapSessionStartTime.current === 0)
          tapSessionStartTime.current = startTap.current;
        break;

      case "touchend":
        tep.preventDefault();
      // falls through
      case "mouseup":
        endTap.current = d.current.getTime();
        var duration = endTap.current - startTap.current;
        //tapCounter++;

        // handle exception
        if (startTap.current === 0 || endTap.current === 0) {
          //console.log("Tap count:"+tapCounter + "; Tap duration:"+duration +" millisec");
          tapLog.current += "<br>Tap #" + tapCounter.current + "; One of the timestamps is 0.";

        } else if (startTap.current > 0 && endTap.current > 0 && startTap.current > endTap.current) {
          //console.log("Tap count:"+tapCounter + "; Tap duration:"+duration +" millisec");
          //tapLog += "<br>Tap count:"+tapCounter + "; Start timestamp larger than end timestamp";

        } else {

          console.log("Tap #" + tapCounter.current + "; Tap duration:" + duration + " ms");
          tapCounter.current++;
          //tapTimeArray.push(duration);
          totalTouchDuration.current += duration;
          var meanTouchDuration = totalTouchDuration.current / tapCounter.current;

          var tap = {};
          //tap["ID"]=uniqueIdentifier;
          //tap["dependentVariable"] = dependentVariable;
          tap["tapSequenceNumber"] = tapCounter.current;
          tap["startTimestamp"] = startTap.current;
          tap["endTimestamp"] = endTap.current;
          tap["interfaceSequence"] = interfaceSequence.current;

          if (showFeedback.current) tap["interface"] = "feedbackshown";
          else tap["interface"] = "nofeedback";
          //console.log(tap);
          //console.log("Tap string:"+JSON.stringify(tap));

          tapLogsArray.current.push(JSON.stringify(tap));
          tapLog.current += "<br>Tap #" + tapCounter.current + "; Tap duration:" + duration + " ms";

          //if(tapCounter>=tapLimit || ((endTap - tapSessionStartTime)/1000) >60 ){
          if (tapCounter.current >= tapLimit) {

            //console.log(JSON.stringify(tapLogsArray));
            interfaceSequence.current++;

            if (interfaceSequence.current <= interfaceVariations) {

              // First variation done — save data, then show Continue button
              setCounterHTML(
                '<span class="spanWhite">Mean tap duration: <span class="spanTime">' +
                Math.round(meanTouchDuration, 2) + "</span> ms</span>"
              );
              setShowTapHere(false);   // document.getElementById("tapHere").style.display="none";
              //console.log(tapLogsArray.toString());
              syncToServer(() => {
                setShowContinue(true); // shown only after server confirms save
              });

            } else {

              // Both variations done — save and finish
              setCounterHTML(
                '<span class="spanWhite">Mean tap duration: <span class="spanTime">' +
                Math.round(meanTouchDuration, 2) + "</span> ms</span>"
              );
              setShowTapHere(false);   // document.getElementById("tapHere").style.display="none";
              //console.log(tapLogsArray.toString());
              syncToServer();
            }

            return; // ← stop execution here, do not fall through to mean display below
          }

          // document.getElementById("counter").innerHTML= "Tap #"+tapCounter+" Mean touch duration: <span class='spanTime'>"+Math.round(meanTouchDuration,2)+"</span> ms";
          if (showFeedback.current)
            setCounterHTML(
              "Mean tap duration: <span class='spanTime'>" +
              Math.round(meanTouchDuration, 2) + "</span> ms"
            );

          //console.log(tapLogsArray);
          //console.log(tapLogsArray.toString());
          //document.getElementById("tapHere").innerHTML= tapLog;
        }

        //console.log(tapLog);
        //document.getElementById("tapHere").innerHTML= tapLog;
        //document.getElementById("counter").innerHTML= tapCounter;

        startTap.current = 0;
        endTap.current = 0;

        break;

      default:
        break;
    }

    //alert("Its is a tap");
  }, []); // empty deps — only reads from refs and stable state setters

  // Attach/detach tap event listeners whenever the tap button mounts or unmounts
  // showContinue intentionally excluded from deps — including it causes the
  // useEffect cleanup to re-run when Continue appears, which interrupts state updates
  useEffect(() => {
    const el = tapHereRef.current;
    if (!el) return;

    // Set mouse and touch listeners
    // tapityTap() is set as the common listener for the events
    ["mouseup", "mousedown", "touchstart", "touchend"].forEach(function (te) {
      el.addEventListener(te, tapityTap);
    });

    return () => {
      ["mouseup", "mousedown", "touchstart", "touchend"].forEach(function (te) {
        el.removeEventListener(te, tapityTap);
      });
    };
  }, [showTapHere, showContainer, tapityTap]); // showContinue excluded intentionally

  function onLoad() {
    // var el = document.getElementById('tapHere');  // handled via ref in React
    d.current = new Date();

    if (d.current.getTime() % 2 === 0) {
      //console.log("Even");
      showFeedback.current = true;
    } else {
      //console.log("Odd");
      //showFeedback = false;
    }

    uniqueIdentifier.current = d.current.getTime();
    var randomNumber = Math.floor(Math.random() * 42);
    uniqueIdentifier.current = uniqueIdentifier.current + "" + randomNumber;
    //console.log("ID:"+uniqueIdentifier+","+randomNumber);

    /*el.addEventListener('mousedown', tapityTap("mousedown"));
    el.addEventListener('mouseup', tapityTap("mouseup"));

    el.addEventListener('touchdown', tapityTap("touchdown"));
    el.addEventListener('touchup', tapityTap("touchup"));*/
    /*["mouseup","mousedown","mouseout","click","dblclick","touchstart","touchend",
    "touchleave","touchmove","touchcancel"].forEach(function(te) {
      el.addEventListener(te, tapityTap);
    });*/

    // Listeners are attached in the useEffect above, mirroring onLoad behaviour

    //document.getElementById("tapHere").innerHTML = "<span class='span2'>Tap here</span>";
  }

  function saveDependentVariable(dVariable) {
    dependentVariable.current = dVariable;
    //document.getElementById("variable1").style.display = "none";
    //document.getElementById("variable2").style.display = "none";
    setShowButtonContainer(false); // document.getElementById("buttoncontainer").style.display = "none";
    setShowContainer(true);        // document.getElementById("container").style.display = "inline-block";
  }

  function syncToServer(onSuccess) {

    const payload = {
      id: uniqueIdentifier.current,
      var: dependentVariable.current,
      taps: tapLogsArray.current.map((tap) => JSON.parse(tap)),
    };

    console.log("Syncing to server with payload:", payload);

    fetch("https://clicklogger-be.onrender.com/saveTaps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Server response:", data);
        console.log("Calling onSuccess, onSuccess exisits", !!onSuccess)
        if (onSuccess) onSuccess(); // fires only after server confirms save
        console.log("Called success")
      })
      .catch((err) => console.error("Error sending taps:", err));

    // Original XHR block kept as reference:
    //
    // var xmlhttp;
    // if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
    //   xmlhttp = new XMLHttpRequest();
    // } else {// code for IE6, IE5
    //   xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    // }
    //
    // xmlhttp.onreadystatechange = function() {
    //   if (this.readyState == 4 && this.status == 200) {
    //     var responseText = this.responseText;
    //     //console.log("Response:"+responseText);
    //     if(responseText !== "Data saved successfully")
    //       // document.getElementById("container").innerHTML = '<span class="spanWhite">Server went away. Please try again.</span>';
    //   }
    // };
    // //var getLookups = "saveTaps.php?id="+uniqueIdentifier+"&var="+dependentVariable+"&taps=["+tapLogsArray+"]";
    // var url = "saveTaps.php";
    // var params ="id="+uniqueIdentifier+"&var="+dependentVariable+"&taps=["+tapLogsArray+"]";
    // xmlhttp.open("POST",url,true);
    // xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    // xmlhttp.send(params);
  }

  function startNext() {
    startTap.current = 0;
    endTap.current = 0;
    tapCounter.current = 0;
    totalTouchDuration.current = 0;
    setShowTapHere(true);    // document.getElementById("tapHere").style.display="block";
    setShowContinue(false);  // document.getElementById("continue").style.display="none";
    setCounterHTML("");      // document.getElementById("counter").innerHTML="";
    if (showFeedback.current) showFeedback.current = false;
    else showFeedback.current = true;
  }

  // ─── Render (mirrors the original HTML body exactly) ─────────────────────
  return (
    <div>
      <p>Click Logger - Nethum</p>

      {/* <div id="buttoncontainer"> */}
      {showButtonContainer && (
        <div id="buttoncontainer">
          <button type="button" onClick={() => saveDependentVariable("android")} id="variable1">
            Android
          </button>
          <button type="button" onClick={() => saveDependentVariable("pc")} id="variable2">
            PC
          </button>
        </div>
      )}

      {/* <div id="container" class="container"> */}
      {showContainer && (
        <div id="container" className="container">
          <div id="counter" dangerouslySetInnerHTML={{ __html: counterHTML }} />
          <div id="action">{actionHTML}</div>

          {/* <button id="tapHere"> — hidden after 50 taps */}
          {showTapHere && (
            <button id="tapHere" ref={tapHereRef}>
              <img src="round_touch_app_white_36dp.png" alt="" />
            </button>
          )}

          {/* <button id="continue" onclick="startNext()">
              Shown after first variation's 50 taps, once server confirms save.
              Clicking resets counters and starts the second variation. */}
          {showContinue && (
            <button id="continue" onClick={startNext}>
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
}