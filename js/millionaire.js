/**
* Edits the number prototype to allow money formatting
*
* @param fixed the number to fix the decimal at. Default 2.
* @param decimalDelim the string to deliminate the non-decimal
*        parts of the number and the decimal parts with. Default "."
* @param breakdDelim the string to deliminate the non-decimal
*        parts of the number with. Default ","
* @return returns this number as a USD-money-formatted String
*		  like this: x,xxx.xx
*/
Number.prototype.money = function(fixed, decimalDelim, breakDelim){
	var n = this, 
	fixed = isNaN(fixed = Math.abs(fixed)) ? 2 : fixed, 
	decimalDelim = decimalDelim == undefined ? "." : decimalDelim, 
	breakDelim = breakDelim == undefined ? "," : breakDelim, 
	negative = n < 0 ? "-" : "", 
	i = parseInt(n = Math.abs(+n || 0).toFixed(fixed)) + "", 
	j = (j = i.length) > 3 ? j % 3 : 0;
	return negative + (j ? i.substr(0, j) +
		 breakDelim : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + breakDelim) +
		  (fixed ? decimalDelim + Math.abs(n - i).toFixed(fixed).slice(2) : "");
}

/**
* Plays a sound via HTML5 through Audio tags on the page
*
* @require the id must be the id of an <audio> tag.
* @param id the id of the element to play
* @param loop the boolean flag to loop or not loop this sound
*/
startSound = function(id, loop) {
	soundHandle = document.getElementById(id);
	if(loop)
		soundHandle.setAttribute('loop', loop);
	soundHandle.play();
}

/**
* The View Model that represents one game of
* Who Wants to Be a Millionaire.
* 
* @param data the question bank to use
*/
var MillionaireModel = function(data) {
	var self = this;

	// The 15 questions of this game
    this.questions = data.questions;

    // A flag to keep multiple selections
    // out while transitioning levels
    this.transitioning = false;

    // The current money obtained
 	this.money = new ko.observable(0);

 	// The current level(starting at 1) 
 	this.level = new ko.observable(1);

 	// The three options the user can use to 
 	// attempt to answer a question (1 use each)
 	this.usedFifty = new ko.observable(false);
 	this.usedPhone = new ko.observable(false);
 	this.usedAudience = new ko.observable(false);

 	this.timer = ko.observable(60);
 	var timerInterval = null;

 	function startTimer() {
 		self.timer(60);
 		clearInterval(timerInterval);
 		$('#timer').removeClass('timeup');
 		timerInterval = setInterval(function() {
 			var t = self.timer();
 			if (t > 0) {
 				self.timer(t - 1);
 			} else {
 				clearInterval(timerInterval);
 				$('#timer').addClass('timeup');
 				var ping = new Audio('sound/wrong.mp3');
 				ping.play();
 				// Do NOT show next button or set nextAction here. Just keep shaking until user answers or moves on.
 			}
 		}, 1000);
 	}

 	// Start timer on first question
 	startTimer();

 	// Reset timer on each new question
 	this.level.subscribe(function(newLevel) {
 		if (newLevel <= 15) startTimer();
 		self.updateQuestionImage();
 		// Prize pool: mark earned prizes
 		$('#levels li').each(function() {
 			var lvl = parseInt($(this).attr('data-lvl'));
 			if (lvl < newLevel) {
 				$(this).addClass('earned');
 			} else {
 				$(this).removeClass('earned');
 			}
 		});
 	});

 	// Update jokers to use [disabled] when used
 	this.usedFifty.subscribe(function(val) {
 		if(val) $('#fifty').attr('disabled', 'disabled');
 		else $('#fifty').removeAttr('disabled');
 	});
 	this.usedPhone.subscribe(function(val) {
 		if(val) $('#phone-friend').attr('disabled', 'disabled');
 		else $('#phone-friend').removeAttr('disabled');
 	});
 	this.usedAudience.subscribe(function(val) {
 		if(val) $('#audience').attr('disabled', 'disabled');
 		else $('#audience').removeAttr('disabled');
 	});

 	// Grabs the question text of the current question
 	self.getQuestionText = function() {
 		return self.questions[self.level() - 1].question;
 	}

 	// Gets the answer text of a specified question index (0-3)
 	// from the current question
 	self.getAnswerText = function(index) {
 		return self.questions[self.level() - 1].content[index];
 	}

 	// Uses the fifty-fifty option of the user
 	self.fifty = function(item, event) {
 		if(self.transitioning)
 			return;
 		$(event.target).fadeOut('slow');
 		var correct = this.questions[self.level() - 1].correct;
 		var first = (correct + 1) % 4;
 		var second = (first + 1) % 4;
 		if(first == 0 || second == 0) {
 			$("#answer-one").fadeOut('slow');
 		}
 		if(first == 1 || second == 1) {
 			$("#answer-two").fadeOut('slow');
 		}
 		if(first == 2 || second == 2) {
 			$("#answer-three").fadeOut('slow');
 		}
 		if(first == 3 || second == 3) {
 			$("#answer-four").fadeOut('slow');
 		}
 	}

 	// Fades out an option used if possible
 	self.fadeOutOption = function(item, event) {
 		if(self.transitioning)
 			return;
 		$(event.target).fadeOut('slow');
 	}

 	// Attempts to answer the question with the specified
 	// answer index (0-3) from a click event of elm
 	self.answerQuestion = function(index, elm) {
 		if(self.transitioning) return;
 		self.transitioning = true;
 		self.setInteractionEnabled(false);
 		clearInterval(timerInterval);
 		// Only the picked answer gets yellow
 		$('.answer').removeClass('selected');
 		$('#' + elm).addClass('selected');
 		setTimeout(function() {
 			var correctIdx = self.questions[self.level() - 1].correct;
 			var correctId = ['answer-one', 'answer-two', 'answer-three', 'answer-four'][correctIdx];
 			// Remove yellow
 			$('#' + elm).removeClass('selected');
 			if (correctIdx == index) {
 				// Correct: clicked answer turns green, play right.mp3, happy host
 				$('#' + elm).addClass('correct');
 				$('#' + correctId + ' span:last-child').addClass('correct-text');
 				$('#host-sitting').attr('src', 'img/happy-host.png');
 				var ping = new Audio('sound/right.mp3');
 				ping.play();
 			} else {
 				// Wrong: clicked answer turns red, correct answer turns green, play wrong.mp3, sad host
 				$('#' + elm).addClass('wrong');
 				$('#' + correctId).addClass('correct');
 				$('#' + correctId + ' span:last-child').addClass('correct-text');
 				$('#host-sitting').attr('src', 'img/sad-host.png');
 				var ping = new Audio('sound/wrong.mp3');
 				ping.play();
 			}
 			self.nextAction = function() {
 				// Show all answers (reset 50-50 joker effect)
 				$('#answer-one, #answer-two, #answer-three, #answer-four').show();
 				// Remove all highlights
 				$('.answer').removeClass('correct wrong selected');
 				$('.answer span:last-child').removeClass('correct-text');
 				$('#host-sitting').attr('src', 'img/host-sitting.png');
 				if (self.level() < 15) {
 					self.level(self.level() + 1);
 					self.transitioning = false;
 					self.setInteractionEnabled(true);
 				}
 			};
 			self.showNextButton();
 		}, 2000);
 	}

 	// Gets the money formatted string of the current won amount of money.
 	self.formatMoney = function() {
	    return self.money().money(2, '.', ',');
	}

	// Add after the definition of self.getQuestionText
	self.updateQuestionImage = function() {
		$('#question-photo-row').remove();
		var lvl = self.level();
		if (lvl === 7 || lvl === 9) {
			var imgSrc = (lvl === 9) ? 'img/9.JPG' : 'img/7.jpg';
			var row = $('<div>', {
				id: 'question-photo-row',
				css: {
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					marginBottom: '18px',
					marginTop: '8px',
					zIndex: 2
				}
			});
			var img = $('<img>', {
				id: 'question-image',
				src: imgSrc,
				alt: 'Question Image',
				css: {
					display: 'block',
					maxWidth: '440px',
					maxHeight: '320px',
					width: '100%',
					height: 'auto',
					borderRadius: '12px',
					boxShadow: '0 2px 18px rgba(0,0,0,0.18)'
				}
			});
			row.append(img);
			$('#question-box').before(row);
		}
	};

	// Call on load and whenever the level changes
	self.updateQuestionImage();

	// Remove the timer-clearing wrappers for rightAnswer and wrongAnswer
	// Restore the original rightAnswer and wrongAnswer implementations
	self.rightAnswer = function(elm) {
		// Highlight the correct answer
		$('#' + elm).addClass('correct');
		var ping = new Audio('sound/right.mp3');
		ping.play();
		setTimeout(function() {
			$('#' + elm).removeClass('correct');
			// Progress to next question or win
			if (self.level() < 15) {
				self.level(self.level() + 1);
				self.transitioning = false;
			} else {
				// Win
				$('#game-over').text('Tebrikler! Kazandınız!').fadeIn();
			}
		}, 1200);
	};
	self.wrongAnswer = function(elm) {
		// Highlight the selected answer as wrong and the correct one as correct
		$('#' + elm).addClass('wrong');
		var correctIdx = self.questions[self.level() - 1].correct;
		var correctId = ['answer-one', 'answer-two', 'answer-three', 'answer-four'][correctIdx];
		$('#' + correctId).addClass('correct');
		var ping = new Audio('sound/wrong.mp3');
		ping.play();
		setTimeout(function() {
			$('#' + elm).removeClass('wrong');
			$('#' + correctId).removeClass('correct');
			// End game
			$('#game-over').text('Yanlış cevap! Oyun bitti.').fadeIn();
		}, 1800);
	};

	// Helper to lock/unlock answers and jokers
	self.setInteractionEnabled = function(enabled) {
		if (enabled) {
			$('.answer').css('pointer-events', 'auto');
			$('#fifty, #phone-friend, #audience').css('pointer-events', 'auto');
		} else {
			$('.answer').css('pointer-events', 'none');
			$('#fifty, #phone-friend, #audience').css('pointer-events', 'none');
		}
	};

	// Remove any previous next button
	self.removeNextButton = function() {
		$('#next-question-btn').remove();
	};

	// Show next button at the top right, to the left of #levels
	self.showNextButton = function() {
		self.removeNextButton();
		var isLast = self.level() === 15;
		var btn = $('<button>', {
			id: 'next-question-btn',
			text: isLast ? 'Yarışmayı bitir' : 'Sonraki Soru',
			css: {
				position: 'absolute',
				top: '32px',
				right: '380px',
				fontSize: '1.2em',
				padding: '10px 22px',
				borderRadius: '8px',
				background: 'linear-gradient(90deg, #ffe259 0%, #ffa751 100%)',
				color: '#222',
				fontWeight: 'bold',
				border: 'none',
				boxShadow: '0 2px 8px #ffe06655',
				cursor: 'pointer',
				zIndex: 10
			},
			click: function() {
				if (isLast) {
					$('#game').hide();
					$('#levels').hide();
					$('#pre-start').css({ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' });
					$('#logo-image').css({ display: 'block', margin: 'auto', opacity: 1 });
					$('#intro-gradient-bg').fadeIn(600);
				} else {
					self.nextQuestion();
				}
			}
		});
		$('#game').append(btn);
	};

	// Add this function to handle next question button
	self.nextQuestion = function() {
		if (typeof self.nextAction === 'function') {
			self.nextAction();
			self.nextAction = null;
		}
		self.removeNextButton();
	};
};

// Executes on page load, bootstrapping
// the start game functionality to trigger a game model
// being created
$(document).ready(function() {
	// ... existing intro/animation code ...

	// Only allow logo click after intro.mp3 is done
	var fixedQuestions = null;
	var introAudio = document.getElementById('intro-audio');
	var logoImage = $('#logo-image');
	logoImage.css('pointer-events', 'none');
	logoImage.css('opacity', '0.7');

	// Load and fix 15 questions from the flat array
	$.getJSON('questions.json', function(data) {
		// If data is an array, use it directly
		if (Array.isArray(data) && data.length === 15) {
			fixedQuestions = data;
		} else if (data.games && data.games[0] && data.games[0].questions) {
			// fallback for old format
			var allQuestions = data.games[0].questions;
			var selected = [];
			var used = {};
			while (selected.length < 15 && selected.length < allQuestions.length) {
				var idx = Math.floor(Math.random() * allQuestions.length);
				if (!used[idx]) {
					selected.push(allQuestions[idx]);
					used[idx] = true;
				}
			}
			fixedQuestions = selected;
		}
	});

	// When intro.mp3 ends, enable logo click
	introAudio.addEventListener('ended', function() {
		logoImage.css('pointer-events', 'auto');
		logoImage.css('opacity', '1');
	});

	// Start game on logo click (with fixed questions)
	logoImage.on('click', function() {
		if (!fixedQuestions || fixedQuestions.length !== 15) return;
		var model = new MillionaireModel({ questions: fixedQuestions });
		ko.applyBindings(model);
		model.timer.subscribe(function(val) { $('#timer').text(val); });
		$('#timer').text(model.timer());
		$('#pre-start').fadeOut('slow', function() {
			startSound('background', true);
			$('#game').fadeIn('slow');
		});
	});

	// Update timer binding in knockout applyBindings
	// In $(document).ready, after ko.applyBindings, add:
	// ko.applyBindings(new MillionaireModel({ questions: fixedQuestions }));
	// $('#timer').text(self.timer());
	// self.timer.subscribe(function(val) { $('#timer').text(val); });
});