function autocomplete(inp, names.name){
    //autocomplete will take input from search and compare it to data from movies.title to attempt to autofill
    var currentFocus;
    inp.addEventListener("input", function(e){ //calls back to this when button is pressed
    var a,b,i,val = this.value;
    closeAllLists();
    if (!val) {return false;}
    currentFocus = -1;
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    //appends element as child of autocomplete container
    this.parentNode.appendChild(a);

    for (i = 0; i < names.name.count(); i++){
        if(names.name[i].substr(0, val.length).toUpperCase() == val.toUpperCase()){
        b = document.createElement("DIV");
        //makes all matching bolded
        b.innerHTML = "<strong>" names.name[i].substr(0, val.length) + "</strong>";
        b.innerHTML += names.name[i].substr(val.length);
        //this input field will hold the names at in this iteration
        b.innerHTML += "<input type= 'hidden' value='" + names.name[i] + "'>";
        //this event listener calls back on clicks on an autofill option
        b.addEventListener("click", function(e){
            //inserts value for autocomplete field
        inp.value = this.getElementsByTagName("input")[0].value;
        //closes list to get ready for next autofill
        closeAllLists();
        });
        a.appendChild(b);
        }
    }
    });
    //callback for pressing a key
    inp.addEventListener("keydown", function(e){
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementByTagName("div");
    if (e.keyCode == 40){
        currentFocus++; //when down arrow is pressed, increases current focus and makes current item more visible
        addActive(x);
    }
    else if (e.keyCode == 38){
        currentFocus--; //up arrow is pressed and decreases current focus, still makes current item more visible
        addActive(x);
    }
    else if (e.keyCode == 13){
        e.preventDefault();
        if (currentFocus > -1){
        //simulates click on active item but doesn't actually enter search
        if (x) x[currentFocus].click();
        }
    } 
    });
    function addActive(x){ //function classifies item as active
    if (!x) return false;
    //first clears all active
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length -1);
    x[currentFocus].classList.add("autocomplete-active"); //add class autocomplete active
    }
    function removeActive(x){
    for (var i =0; i<x.length; i++){
        if (elmnt != x[i] && elmnt != inp){
        x[i].parentNode.removeChild(x[i]);
        }
    }
    }
    document.addEventListener("click", function (e){
    closeAllLists(e.target);
    });
}
    