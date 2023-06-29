/*
    File: scrabble.js
    GUI Assignment: Creating a Modified Scrabble Game
    Ethan Rosenbaum, UML Computer Science, ethan_rosenbaum@student.uml.edu

    Copyright (c) 2023 by Ethan. All Rights reserved. May be
    freely copied or excerpted for educational purposes with credit to the author.

    Header taken from HW assignment 1 example by Wenjin Zhou.
*/

//
// Create the game board - only one line of scrabble.
//
// The game board is a table where each cell is a square on the board - double letter
// scores are added in the layout of a traditional scrabble board.
//

// Global JQUERY variables for game board and tile rack.
$tileRack  = $("#tilerack");
$gameBoard = $("#gameboard");

$gameBoard.css({
    "height" : "200px",
    "border" : "3px solid black"
});

var $board = $("<table>");
var $row   = $("<tr>");

for (let i = 0; i < 15; i++) {
    let $boardSquare = $("<td>")
        .addClass('board-square')
        .attr('id', 'square-' + i)
        .data('location', i);

    if ((i == 6) || (i == 8)) {
        $boardSquare.addClass("double-letter");
    }

    if ((i == 2) || (i == 12)) {
        $boardSquare.addClass("double-word");
    }

    $boardSquare.appendTo($row);
}

$row.appendTo($board);
$board.appendTo($gameBoard);

//
// Parsing of JSON with data for scrabble tiles.
// Tiles are created as they are parsed.
//
// https://api.jquery.com/jquery.getJSON/
//

var jsonURL= "JSON/pieces.json";
var pieces = [];

$.getJSON(jsonURL).done(function(json) {
    $.each(json.pieces, function(i, piece) {
        let letter = piece.letter;
        let amount = piece.amount;
        let value  = piece.value;
        let img    = piece.img;

        // Create a tile up to the amount specified
        for (let index = 0; index < amount; index++) {
            let newLetter = $("<div>")
                .addClass('tile')
                .data('letter', letter)
                .data('score-value', value)
                .data('played', false)
                .css({
                    "width": "60px",
                    "height": "60px"
                });
            
            let content = $("<img>")
                .attr('src', img)
                .css({
                    "height": "60px",
                    "width": "60px",
            });

            content.appendTo(newLetter);
            pieces.push(newLetter);
            
        }

    });
});

//
// Global variables
//
var totalGameScore = 0;
var roundScore = 0;
var currentWord = [];

// Durstenfeld shuffle:
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//
// Draws the next tiles from the top of the deck. (beginning of array)
// The array is modified on draw and the new number of remaining tiles is displayed to the player.
//
// Tiles are made draggable here in order to give them the proper properties.
//
function drawTiles(n) {
    for (let i = 0; i < n; i++) {

        // Deplete the deck - no need to keep track of discard
        var tile = pieces.shift();

        console.log(tile);
        
        $tileRack.append(tile);

        // https://stackoverflow.com/questions/18789354/how-do-i-make-dynamically-created-elements-draggable
        $( function()  {
            $(".tile").draggable({
                revert: "invalid",
                snap: ".board-square",
                snapMode: "inner",
                stop: function(){
                    $(this).draggable('option','revert','invalid');
                }
            });
        });
    }

    $("#total-game-score-rem-tiles").text(pieces.length + " tiles in deck");
    
}


//
// Wait for page to be ready before shuffling and drawing tiles.
//
$('document').ready( function (){
    // New Game
    shuffle(pieces);
    drawTiles(7);
});

//
// .board-square droppable rules:
//  * Revert back to original location: 
//    https://stackoverflow.com/questions/7859565/jquery-ui-how-can-i-make-draggable-always-revert
//
$( function()  {
    $(".board-square").droppable({
        tolerance: 'fit',

        // drop event handler
        drop: function(event, ui) {
            var $this  = $(this);

            // Prevent multiple elements from being dropped on the same tile.
            if($this.data('dropped')) {
                console.log('Rejecting because dropped!');
                ui.draggable.draggable('option','revert',true);
                return;
            }

            // Prevent multiple elements from being dropped on the same tile.
            if(ui.draggable.data('played')) {
                console.log('Rejecting because played!');
                ui.draggable.draggable('option','revert',true);
                return;
            }

            // Prevent gaps in letter placement.
            if(!checkValidLetterPlacement($this.data('location'))) {
                console.log('Rejecting because invalid place!');
                ui.draggable.draggable('option','revert',true);
                return;
            }

            // Flag square as occupied.
            $this.data('dropped', true);
            ui.draggable.data('played', true);

            // Center draggable in droppable.
            // https://stackoverflow.com/questions/26746823/jquery-ui-drag-and-drop-snap-to-center
            ui.draggable.position({
                my: "center",
                at: "center",
                of: $this,
                using: function(pos) {
                    $(this).animate(pos, 200, "linear");
                } });

                // https://stackoverflow.com/questions/36769548/javascript-drag-and-drop-prevent-elements-from-dropping-into-another-droppable
                ui.draggable.draggable('disable');

                // Get tile value, adjust score if necessary, then update score.
                var score  = ui.draggable.data('score-value');
    
                if ($this.hasClass('double-letter')){
                    score *= 2;
                }
                roundScore += score; 
                $("#current-board-score").text(roundScore + " points");

                // Get the value of the letter tile on the board square, encode the location
                // in the class name, and then add it to the array of currently placed letters.
                var letter = ui.draggable.data('letter');
                span = $("<span>").addClass($this.attr('id') + "-" + letter).text(letter);
                currentWord.push(span);

                // Update the on-screen data - this will also sort the array based on location.
                updateWord();

            },
    });
});

//
// Updates the word on screen - this will sort the current letters on the board
// by location. The printed word is always cleared.
//
function updateWord() {
    // Prevent stale data
    $("#current-board-word").empty();

    // Sort the current word by location on the board to give it proper ordering.
    if (currentWord.length > 1) {
        currentWord.sort(function(a, b) {
            return Number(a.attr('class').split('-')[1]) > Number(b.attr('class').split('-')[1]);
        });
    }

    // Create the new displayed text string.
    for (let i = 0; i < currentWord.length; i++) {
        $("#current-board-word").append(currentWord[i]);
    }
}

//
// Determines whether the index given is the valid index for a player to place a tile.
//
function checkValidLetterPlacement(index) {
    // Its all valid if there is nothing on the board
    if (currentWord.length == 0) {
        return true;
    }

    // Get the location, encoded in the class name of the span's within currentWords, for
    // judging whether the placement is legitimate.
    var firstIndex = Number(currentWord[0].attr('class').split('-')[1]);
    var lastIndex = Number(currentWord[currentWord.length - 1].attr('class').split('-')[1]);

    // Check if the newly placed tile is adjacent to either the first or last tile.
    if((index == (lastIndex + 1)) || (index == (firstIndex - 1))) {
        return true;
    }

    false;
}

// Function for 'submit' button
function submitCurrentWord() {

    // Invalid submission - nothing placed on board.
    if(currentWord.length == 0) {
        return;
    }

    // Apply double word score tile if necessary
    $(".board-square").each(function(){
        console.log(this);
        if($(this).data('dropped') && $(this).hasClass('double-word')) {
            roundScore *= 2;
        }
    });

    // Set-up the additions to the game score tally
    var newRow = $("<tr>").addClass('round-score');

    var textInput = "";
    for (let i = 0; i < currentWord.length; i++) {
        textInput += currentWord[i].text();
    }

    console.log(textInput)
    newRow.append($("<td>").text(textInput));
    newRow.append($("<td>").text(roundScore));

    newRow.appendTo($("#total-game-score table"));

    // Update total score
    totalGameScore += roundScore;
    $("#total-game-score-sum").text("Total Points: " + totalGameScore);

    // Reset the board
    currentWord = [];
    roundScore  = 0;

    // Update the round score and currently played tiles (none)
    $("#current-board-score").text(roundScore + " points");
    updateWord();

    // Fill with new tiles - https://stackoverflow.com/questions/3024391/how-do-i-iterate-through-children-elements-of-a-div-using-jquery.
    $tileRack.children().each(function(){
        console.log(this);
        if($(this).data('played')) {
            this.remove();
        }
    });
    drawTiles(7 - ($tileRack.children().length));


    // Clear board
    $(".board-square").each(function() {
        $(this).data('dropped', false);
    });
}

// Submit button
$("#submit").click(function () {
    submitCurrentWord();
});

// Reset button reloads the page - https://stackoverflow.com/questions/2099201/javascript-hard-refresh-of-current-page.
$("#reset").click(function () {
    location.reload();
});

