// prototype that represents a row in the gradesGrid
function record(name, grade, weight) {
    this.name = name;
    this.grade = grade;
    this.weight = weight;
}

// vector of record objects updated whenever grade is calculated
var records = [];
var cstring = "records";
var minStartingRows = 5;

// wire up events
window.onload = function() {
		var cookie = Cookies.get(cstring);
	
		// Load table if cookie exists
		if (Cookies.enabled && cookie !== undefined) {
			var json_str = cookie;
			records = JSON.parse(json_str);
			$("#gradesGrid tbody tr").remove();
			
			// build gradesGrid from cookie
			$.each(records, function(rowIndex, r) {
				var row = $("<tr />");
				if ((rowIndex % 2 ) == 1)
					row.addClass("alt");
				
				row.append($("<td />").append(createEditable(r.name)));
				row.append($("<td />").append(createEditable(r.grade*100)).append("%"));
				row.append($("<td />").append(createEditable(r.weight)).append("%"));
				row.append($("<td />").text("0.00"));
				$("#gradesGrid tbody").append(row);
			});
			updateGrade();
		} // end cookie
		
		// wire the clear button
		$("#clearTable").on("click", function(){
			records = [];
			$("#gradesGrid tbody tr").remove();
			updateGrade();
			updateMoreInfo(false, false)
			while ($("#gradesGrid tbody tr").length < minStartingRows)
			insertRow();
			focusFirstCell();
		});
		
		// wire Add Item button
    var addItem = $("#addItem")[0];
    addItem.onclick = insertRow;
		
    // wire up showMoreInfo checkbox
    var showMoreInfo = document.getElementById("showMoreInfo");
    showMoreInfo.onclick = function() {
        updateMoreInfo(true, true);
    }
		
		// click it if requested by 'more' parameter in URL
    var more = getUrlParameter("more");
		if (more !== undefined)
			showMoreInfo.click();
		else 
			showMoreInfo.onclick(); // update html to reflect default state

    initEditables(); // makes the spans containing the numbers be able to turn into inputs on focus

		// make sure we have some rows for the user to start with
		while ($("#gradesGrid tbody tr").length < minStartingRows)
			insertRow();

    focusFirstCell(); // set focus to first cell of the table
}

function saveCookie() {
	if (Cookies.enabled) {
		var $saveLabel = $("#saveSuccess");
		var json_str = JSON.stringify(records);
		Cookies.set(cstring, json_str, {expires: 5256000}); // two months
		$saveLabel.css({
			visibility: "visible",
			opacity: 0.0
		}).animate({
			opacity: 1.0
		}, 200);
		$saveLabel.css("color", "green");
		setTimeout(function() {
			$saveLabel.css("color", "darkgreen")
		}, 200);
		setTimeout(function() {
			$saveLabel.animate({
				opacity: 0.0
			}, 1000, function () {
				$saveLabel.css("visibility", "hidden");
			})
		}, 400);
	}
}

// Adds editing functionality to any spans with the editable classname.
// On focus, an editable span will be reaplaced with a text input initialized
// with the value of the span. On blur, the text input will be replaced with
// the hidden span, updated with the new value.
// Note that these spans cannot be edited to be an empty string.
function initEditables() {
    var editables = document.getElementsByClassName("editable"); // IE9+
    for (var i = 0; i < editables.length; i++) {
        editables[i].onfocus = function(event) {
            var span, input, text;
            span = event.target;
            if (span && span.tagName.toUpperCase() === "SPAN") {
                span.style.display = "none"; // hide

                text = span.textContent; // retrieve text

                // build input element
                input = document.createElement("input");
                input.type = "text";
                input.value = span.textContent;
                input.size = Math.max(text.length / 2, 2);

                span.parentNode.insertBefore(input, span);
                input.select(); // select all text to allow quick changes

                // restore plain text upon input losing focus
                input.onblur = function() {
                    span.parentNode.removeChild(input);
                    if (input.value !== "") // edit to empty string will be ignored
                        span.textContent = input.value;
                    span.style.display = "";

                    var nprecs = records.length;
                    updateGrade();
                    var nnrecs = records.length;
                    updateMoreInfo(nnrecs > nprecs, false);
                }
            }
        }
    }
}

// show or hide name column based on argued checkbox's checked value
function toggleNameColumn(cb) {
    var table = document.getElementById("mainTable");
    var rowCount = table.rows.length;
    var footer = table.rows[rowCount - 1];
    var cspan = footer.cells[0].colSpan;

    for (var i = 0; i < rowCount; i++) {
        table.rows[i].cells[0].style.display = cb.checked ? "" : "none";
    }
    //footer.cells[0].colSpan = cb.checked ? cspan + 1 : cspan - 1;
    focusFirstCell();
}

// 1. update record vector
//			note that only entries with nonzero weight are stored
// 2. update gradesGrid and current grade
function updateGrade() {
    var totalEarned = 0.0;
    var totalWeight = 0.0;
    var gradeLabel = document.getElementById("gradeLabel");
    var table = document.getElementById("mainTable");
    var totalEarnedLabel = document.getElementById("totalEarned");
    var totalPossibleLabel = document.getElementById("totalPossible");

    records = []; // clear records vector for rebuilding

    // there is probably a more elegant way to access elements
    for (var i = 1; i < table.rows.length - 1; i++) {
        var cells = table.rows[i].cells;
        var name = $(cells[0]).find("span").text();
        var score = parseFloat($(cells[1]).find("span").text()) / 100.0;
        var weight = parseFloat($(cells[2]).find("span").text());
        var rec = new record(name, score, weight);
        if (weight > 0.0)
            records.push(rec);
        var earned = (weight * 1.0 * score);
        totalEarned = totalEarned + earned;
        totalWeight = totalWeight + weight;
        cells[3].textContent = earned.toFixed(2);
    }

    var displayedGrade = totalEarned.toFixed(2);
    totalEarnedLabel.textContent = totalEarned.toFixed(2);
    totalPossibleLabel.textContent = totalWeight.toFixed(2);

    if (!Number.isNaN(totalEarned)) {
        gradeLabel.textContent = "Current grade: " + displayedGrade + "%";
        $warningLabel = $("#warningLabel");

        // if the total of the assignment weights do not sum to 100, notify user

        if (totalWeight == 100) // hide label
            $warningLabel.animate({
            opacity: 0.0
        }, 200, function() {
            $warningLabel.css("visibility", "hidden");
        });
        else {
            // animate showing of label if not already visible
            if ($warningLabel.css("visibility") == "hidden") {
                $warningLabel.css({
                    visibility: "visible",
                    opacity: 0.0
                }).animate({
                    opacity: 1.0
                }, 200);
                $warningLabel.css("color", "red");
                setTimeout(function() {
                    $warningLabel.css("color", "darkred")
                }, 200);
            }
        }
    } else {
			gradeLabel.textContent = "Current grade: 0.00%";
		}
		saveCookie();
}

// make sure to call updateGrade() first
function updateMoreInfo(redraw, fade) {
    var moreInfo = document.getElementById("moreInfoGrid");
    var $moreInfo = $("#moreInfoGrid")
    var $migw = $("#moreInfoGridWrapper");
    var $migd = $("#moreInfoGridDesc");
    var showMoreInfoChecked = document.getElementById("showMoreInfo").checked;

    // clear the moreInfo table before rebuilding it
    var moreInfoGridRows = document.getElementById("moreInfoGrid").getElementsByTagName("tbody")[0].getElementsByTagName("tr");

    for (var i = 0; i < moreInfoGridRows.length;)
        $(moreInfoGridRows[i]).remove();

    $("#moreInfoGrid tfoot tr").remove();

    // determine total of earned and possible points
    var earned = 0.0;
    var possible = 0.0;
    $.each(records, function(ind, rec) {
        earned += rec.grade * rec.weight;
        possible += rec.weight;
    });

    // build the table
    $.each(records, function(rowIndex, r) {
        var row = $("<tr/>");
				var temp = 0.0;

        if ((rowIndex % 2) == 1)
            row.addClass("alt");
        row.append($("<td />").text(r.name));
				
				for (i = 0.9; i >= 0.5; i=i-0.1)
					row.append($("<td />").text(neededGrade(r.grade, r.weight, earned, possible, i).toFixed(2)));

        $("#moreInfoGrid tbody").append(row);

    });

		// Remaining row
    var rem = $("<tr/>");
    rem.append($("<td />").text("Remaining"));
		
		for (i = 0.9; i >= 0.5; i=i-0.1) {
			if (possible >= 100)
				rem.append($("<td />").text("--"));
			else
				rem.append($("<td />").text(neededGrade(0, 100 - possible, earned, possible, i).toFixed(2)));
		}
	
    $("#moreInfoGrid tfoot").append(rem);
	
		// determine the height needed for the more information grid
		// used for the cool sliding effect
		var heightNeeded = 30.0; // workaround; should be 0
		$migw.children().each(function (i, e) {
			heightNeeded += $(e).outerHeight(true);
		});
		
    if (showMoreInfoChecked)
        $migw.css("max-height", heightNeeded + "px");

    // redraw table if desired
    if (redraw) {

        if (showMoreInfoChecked) {
             $migw.css("max-height", heightNeeded + "px");
            $moreInfo.css("visibility", "visible");
            if (fade) {
                $moreInfo.css("opacity", "0.0").animate({
                    opacity: 1.0
                }, 100, function() {
                    $migd.css("opacity", "0.0").delay(200).animate({
                        opacity: 1.0
                    }, 200);
                });
            }
            $migd.css("visibility", "visible");

        } else {
            $moreInfo.animate({
                opacity: 0.0
            }, 100, function() {
                $moreInfo.css("visibility", "hidden");
            });
            $migd.animate({
                opacity: 0.0
            }, 100, function() {
                $migd.css("visibility", "hidden");
            });
            $migw.animate({
                "max-height": "0px"
            }, 0);
        }
    }
}

// determines the grade needed on remaining assignments needed to achieve a desired grade
function neededGrade(grade, weight, totalEarned, totalPossible, desired) {
    var earned = totalEarned - (grade * weight);
    var possible = totalPossible - weight;

    return ((desired - earned / 100) / weight) * 10000;
}

// inserts a row into the gradesGrid
function insertRow() {
		var table = $("#mainTable")[0];
		var nrows = table.rows.length;
	
		var row = $("<tr />");
		if (nrows % 2 === 1)
			row.addClass("alt");
		
		row.append($("<td />").append(createEditable("Assignment " + (nrows - 1))));
		row.append($("<td />").append(createEditable("0.0")).append("%"));
		row.append($("<td />").append(createEditable("0.0")).append("%"));
		row.append($("<td />").text("0.00"));
		$("#gradesGrid tbody").append(row);
		
		initEditables();
}

// focuses first cell in gradesGrid
function focusFirstCell() {
    var nameCell = document.getElementById("mainTable").rows[1].cells[0];
    if (nameCell.style.display != "none")
        nameCell.getElementsByTagName("span")[0].focus();
    else
        document.getElementById("mainTable").rows[1].cells[1].getElementsByTagName("span")[0].focus();
}

// helper to get url parameters
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1];
        }
    }
};

function createEditable(text) {
	return $("<span />").addClass("editable").text(text).attr("tabindex", "0");
}