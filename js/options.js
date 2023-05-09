
var btn=document.getElementById('button');
   
btn.onclick=saveValues;

function saveValues() {
    var username = document.getElementById("userName").value;
    // var accesstoken = document.getElementById("token").value;
    localStorage.setItem("userName", username);
    // if (accesstoken) {
        // localStorage.setItem("token", accesstoken);
    // } else {
        // localStorage.removeItem("token");
    // }
    
    window.location.href = "popup.html";
}