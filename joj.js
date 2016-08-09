// wire up events
window.onload = function() {
	var addItem = document.getElementById("addItem");
	addItem.onclick = insertRow;
	
	initEditables(); // makes the spans containing the numbers be able to turn into inputs on focus
	
	for (var i = 0; i < 5; i++) // lets throw some more rows in by default
		insertRow();
	
	// wire the show name column checkbox
	var showNames = document.getElementById("showNames");
	showNames.onclick = function() { toggleNameColumn(showNames); };
	
	toggleNameColumn(showNames); // and update the form with its default value
	
	focusFirstCell(); // set focus to first cell of the table
}

// Adds editing functionality to any spans with the editable classname.
// On focus, an editable span will be reaplaced with a text input initialized
// with the value of the span. On blur, the text input will be replaced with 
// the hidden span, updated with the new value.
function initEditables() {
	var editables = document.getElementsByClassName("editable");
	for (var i = 0; i < editables.length; i++) {
		editables[i].onfocus = function(event) {
			var span, input, text;
			span = event.target;
			if (span && span.tagName.toUpperCase() === "SPAN") {
				span.style.display = "none"; // hide
				
				text = span.innerHTML; // retrieve text
				
				input = document.createElement("input");
				input.type = "text";
				input.value = span.innerHTML;
				input.size = Math.max(text.length / 4 * 3, 4);
				input.select();
				span.parentNode.insertBefore(input, span);
				
				input.focus();
				
				input.onblur = function() {
					span.parentNode.removeChild(input);
					span.innerHTML = input.value;
					span.style.display = "";
					updateGrade();
				}
			}
		}
	}
}

function toggleNameColumn(cb) {
	var table = document.getElementById("mainTable");
	var rowCount = table.rows.length;
	var footer = table.rows[rowCount-1];
	var cspan = footer.cells[0].colSpan;
	
	for (var i = 0; i < rowCount-1; i++) {
		table.rows[i].cells[0].style.display = cb.checked ? "" : "none";
	}
	footer.cells[0].colSpan = cb.checked ? cspan + 1 : cspan - 1;
	focusFirstCell();
}

function updateGrade() {
	var totalEarned = 0.0;
	var totalWeight = 0.0;
	var gradeLabel = document.getElementById("gradeLabel");
	var letter = "N/A"
	
	var table = document.getElementById("mainTable");
	
	// TODO eww literals. find a more elegant solution.
	for (var i = 1; i < table.rows.length-1; i++) { 
		var cells = table.rows[i].cells;
		var score = parseInt(cells[1].getElementsByTagName("span")[0].innerHTML) / 100;
		var weight = parseInt(cells[2].getElementsByTagName("span")[0].innerHTML);
		var earned = (weight*score);
		totalEarned = totalEarned + earned;
		totalWeight = totalWeight + weight;
		cells[3].innerHTML = earned.toFixed(2);
	}
	
	var grade = (totalEarned/totalWeight*100);
	
	displayedGrade = grade.toFixed(2);
	
	if (!Number.isNaN(grade)) {
		gradeLabel.innerHTML = "Current grade: " + displayedGrade;
		document.getElementById("warningLabel").style.visibility = totalWeight == 100 ? "hidden" : "";
	}
}

function insertRow() {
	var table = document.getElementById("mainTable");
	var new_row = table.rows[table.rows.length-3].cloneNode(true); // bad
	table.getElementsByTagName("tbody")[0].appendChild(new_row);
	initEditables(); // eww
}

function focusFirstCell() {
	var nameCell = document.getElementById("mainTable").rows[1].cells[0];
	if (nameCell.style.display != "none")
		nameCell.getElementsByTagName("span")[0].focus();
	else
		document.getElementById("mainTable").rows[1].cells[1].getElementsByTagName("span")[0].focus();
}