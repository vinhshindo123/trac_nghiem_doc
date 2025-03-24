const quizTimer = document.querySelector("#timer");
const quizProgress = document.querySelector("#progress");
const quizProgressText = document.querySelector("#progress_text");
const quizSubmit = document.querySelector("#quiz_submit");
const quizPrev = document.querySelector("#quiz_prev");
const quizNext = document.querySelector("#quiz_next");
const quizCount = document.querySelector(".quiz_question h5");
const quizAnswers = document.querySelectorAll(".quiz_question ul li");
let quizQuestions = document.querySelectorAll(".quiz_numbers ul li");
const quizQuestionList = document.querySelector(".quiz_numbers ul");
const quizAnswersItem = document.querySelectorAll(".quiz_answer_item");
const quizTitle = document.querySelector("#quiz_title");
const quizIncorretText = document.querySelector('#quiz_incorrect');
const testSelect = document.getElementById('test_select');
let currentIndex = 0;
let listSubmit = []; // Lưu index đáp án đã chọn
let listResults = []; // Lưu index kết quả đúng, theo mảng đã random
let isSubmit = false;
let countQuestion = 0;
let savedAnswers = {};
let savedColor = {};
let correct = 0;
let incorrect_text = ""
let dataSelect; // Lưu trữ dữ liệu câu hỏi

testSelect.addEventListener('change', function () {
    const selectedTest = this.value;

    fetch(`${selectedTest}.txt`)
        .then(response => response.text())
        .then(data => {
            dataSelect = JSON.parse(data);
            console.log(dataSelect)
            currentIndex = 0;
            listSubmit = [];
            listResults = [];
            countQuestion = 0;
            savedAnswers = {};
            savedColor = {};
            correct = 0;
            incorrect_text = ""
            quizQuestions.forEach((item) => item.classList.remove("active"));
            document.querySelector(".quiz_question ul").style.display = 'block';
            quizAnswers.forEach((item) => {
                item.classList.remove("active");
                item.classList.remove("incorrect");
            });
            quizIncorretText.forEach((item) => item.style.display = "none");

            renderQuestion(dataSelect);
        })
        .catch(error => console.error('Error loading file:', error));
});

function renderQuestion(lists) {
    let render = "";
    lists = lists["quizz"]
    lists.forEach((question, index) => {
        render += `<li>${index + 1}</li>`;
        countQuestion++;
    });
    quizQuestionList.innerHTML = render;
    quizQuestions = document.querySelectorAll(".quiz_numbers ul li");
    quizQuestions[0].classList.add("active");

    quizCount.innerText = `Question ${currentIndex + 1} of ${lists.length}`;
    quizTitle.innerText = lists[currentIndex].question;
    quizAnswersItem.forEach((answer, index) => {
        answer.innerText = lists[currentIndex].answers[index];
    });

    quizProgress.style = `stroke-dasharray: 0 9999;`;
    quizProgressText.innerText = `0/${lists.length}`;
    handleQuestionList();
    handleAnswer();
}

function checkInputsFilled() {
    const inputs = document.querySelectorAll(".finish_input");
    return Array.from(inputs).every(input => input.value.trim() !== "");
}

function highlightInputBorders(correct) {
    const correctAnswers = correct.split(',');
    const inputs = document.querySelectorAll(".finish_input");
    incorrect_text = ""
    if (inputs && inputs.length > 0) {
        inputs.forEach((input, index) => {
            if (input.value.trim() === correctAnswers[index]) {
                input.style.borderColor = "green";
                savedColor[index] = "green"
            } else {
                console.log(`Cấu thứ ${index + 25} đáp án đúng là ${correctAnswers[index]}`)
                incorrect_text += `Cấu thứ ${index + 25} đáp án đúng là ${correctAnswers[index]}\n`
                input.style.borderColor = "red";
                savedColor[index] = "red";
            }
        });
    } else {
        Object.entries(savedAnswers).forEach(([index, value]) => {
            if (value.trim() == correctAnswers[parseInt(index)]) {
                savedColor[parseInt(index)] = "green";
            } else {
                savedColor[parseInt(index)] = "red";
                console.log(`Câu thứ ${parseInt(index) + 25} đáp án đúng là ${correctAnswers[parseInt(index)]}`)
                incorrect_text += `Cấu thứ ${parseInt(index) + 25} đáp án đúng là ${correctAnswers[parseInt(index)]}\n`
            }
        })
    }

    if (currentIndex + 1 === 25) {
        quizIncorretText.innerText = incorrect_text
        quizIncorretText.style.display = "block"
    }
}

function saveInputValues() {
    const inputs = document.querySelectorAll(".finish_input");
    inputs.forEach((input, index) => {
        savedAnswers[index] = input.value.trim();
    });
}

function restoreInputValues() {
    const inputs = document.querySelectorAll(".finish_input");
    inputs.forEach((input, index) => {
        if (savedAnswers[index]) {
            input.value = savedAnswers[index];
        }
    });
}

function renderCurrentQuestion(lists) {
    lists = lists["quizz"]
    if (currentIndex + 1 === 25) {
        quizCount.innerText = `Question ${currentIndex + 1} of ${lists.length}`;
        let text_input = lists[currentIndex].question.replace(/__________/g, '<input type="text" class="finish_input"></input>');
        text_input = text_input.replace(/\n/g, "<br>");

        quizTitle.innerHTML = text_input;
        document.querySelector(".quiz_question ul").style.display = 'none';

        restoreInputValues();

        const inputs = document.querySelectorAll(".finish_input");
        inputs.forEach(input => {
            input.addEventListener("input", function () {
                saveInputValues();
                if (checkInputsFilled()) {
                    quizQuestions[currentIndex].classList.add("selected");
                    listSubmit[currentIndex] = 0;
                    handleProgress();
                } else {
                    quizQuestions[currentIndex].classList.remove("selected");
                    listSubmit.splice(currentIndex, 1);
                    handleProgress();
                }
            });
        });
    } else {
        document.querySelector(".quiz_question ul").style.display = 'flex';
        quizCount.innerText = `Question ${currentIndex + 1} of ${lists.length}`;
        quizTitle.innerText = lists[currentIndex].question;

        quizAnswersItem.forEach((answer, index) => {
            answer.innerText = lists[currentIndex].answers[index];
        });
    }
}

function handleQuestionList() {
    quizQuestions.forEach((item, index) => {
        item.addEventListener("click", async () => {
            item.scrollIntoView({
                behavior: "smooth",
                inline: "center",
            });

            quizQuestions.forEach((item) => item.classList.remove("active"));
            item.classList.add("active");
            currentIndex = index;

            renderCurrentQuestion(dataSelect); // Dùng dữ liệu đã có sẵn để render câu hỏi

            quizAnswers.forEach((item) => item.classList.remove("active"));

            const selected = listSubmit[currentIndex];
            selected >= 0 && quizAnswers[selected].click();

            if (isSubmit) {
                renderResults();
                handleProgress(correct);
            } else {
                handleProgress();
            }
        });
    });
}

quizNext.addEventListener("click", () => {
    ++currentIndex;
    if (currentIndex > countQuestion - 1) {
        currentIndex = 0;
    }

    quizQuestions[currentIndex].scrollIntoView({
        behavior: "smooth",
        inline: "center",
    });

    quizQuestions.forEach((item) => item.classList.remove("active"));
    quizQuestions[currentIndex].classList.add("active");

    renderCurrentQuestion(dataSelect);

    quizAnswers.forEach((item) => item.classList.remove("active"));

    const selected = listSubmit[currentIndex];
    console.log(listSubmit);
    selected >= 0 && quizAnswers[selected].click();

    if (isSubmit) {
        renderResults();
        handleProgress(correct);
    } else {
        handleProgress();
    }
});

quizPrev.addEventListener("click", () => {
    --currentIndex;
    if (currentIndex < 0) {
        currentIndex = countQuestion - 1;
    }

    quizQuestions[currentIndex].scrollIntoView({
        behavior: "smooth",
        inline: "center",
    });

    quizQuestions.forEach((item) => item.classList.remove("active"));
    quizQuestions[currentIndex].classList.add("active");

    renderCurrentQuestion(dataSelect);

    quizAnswers.forEach((item) => item.classList.remove("active"));

    const selected = listSubmit[currentIndex];
    console.log(listSubmit);
    selected >= 0 && quizAnswers[selected].click();

    if (isSubmit) {
        renderResults();
        handleProgress(correct);
    } else {
        handleProgress();
    }
});

function handleAnswer() {
    quizAnswers.forEach((answer, index) => {
        answer.addEventListener("click", () => {
            if (!isSubmit) {
                quizAnswers.forEach((item) => item.classList.remove("active"));
                answer.classList.add("active");
                quizQuestions[currentIndex].classList.add("selected");
                listSubmit[currentIndex] = index;
                handleProgress();
            } else {
                return;
            }
        });
    });
}

function handleProgress(correct) {
    const r = quizProgress.getAttribute("r");
    if (!isSubmit) {
        const progressLen = listSubmit.filter((item) => item >= 0);
        quizProgress.style = `stroke-dasharray: ${(2 * Math.PI * r * progressLen.length) / countQuestion
            } 9999;`;
        quizProgressText.innerText = `${progressLen.length}/${countQuestion}`;
    } else {
        quizProgress.style = `stroke-dasharray: ${(2 * Math.PI * r * correct) / countQuestion
            } 9999;`;
        quizProgressText.innerText = `${correct}/${countQuestion}`;
    }
}

quizSubmit.addEventListener("click", () => {
    const progressLen = listSubmit.filter((item) => item >= 0);
    if (progressLen.length === countQuestion) {
        handleCheckResults(dataSelect);
        renderResults();
    } else {
        alert("Bạn chưa chọn hết đáp án");
    }
});

// // Kiểm tra kết quả sau khi nộp bài
// function handleCheckResults(lists) {
//     correct = 0;
//     lists["quizz"].forEach((item, index) => {
//         if (index === 24) {
//             const correctAnswers = item.answer;
//             highlightInputBorders(correctAnswers);
//             correct++;
//             listResults[index] = listSubmit[index];
//         } else {
//             const result = item.answer;
//             if (item.answers[listSubmit[index]] === result) {
//                 listResults[index] = listSubmit[index];
//                 correct++;
//             } else {
//                 quizQuestions[index].classList.add("incorrect");
//                 listResults[index] = item.answers.indexOf(result);
//             }
//         }
//     });
//     isSubmit = true;
//     handleProgress(correct);
// }

function handleCheckResults(lists) {
    correct = 0;
    lists["quizz"].forEach((item, index) => {
      if (index == 24) {
        const correctAnswers = lists["results"].find(r => String(r.quiz_id) === String(item.id)).answer;
        highlightInputBorders(correctAnswers);
        correct++;
        listResults[index] = listSubmit[index];
      } else {
        const result = lists["results"].find((r) => String(r.quiz_id) === String(item.id));
  
        if (item.answers[listSubmit[index]] === result.answer) {
          listResults[index] = listSubmit[index];
          correct++;
        } else {
          quizQuestions[index].classList.add("incorrect");
          listResults[index] = item.answers.indexOf(result.answer);
        }
      }
    }); 
    isSubmit = true;
    handleProgress(correct);
  }

// Render kết quả
function renderResults() {
    if (currentIndex + 1 === 25) {
        const inputs = document.querySelectorAll(".finish_input");

        quizIncorretText.innerText = incorrect_text
        quizIncorretText.style.display = "block"

        Object.entries(savedColor).forEach(([index, colors]) => {
            inputs[parseInt(index)].style.borderColor = colors
        })
    } else {
        quizIncorretText.style.display = "none"

        if (listResults[currentIndex] === listSubmit[currentIndex]) {
            quizAnswers.forEach((item) => {
                item.classList.remove("incorrect");
            });
            quizAnswers[listResults[currentIndex]].classList.add("active");
        } else {
            quizAnswers.forEach((item) => {
                item.classList.remove("active");
                item.classList.remove("incorrect");
            });
            quizAnswers[listResults[currentIndex]].classList.add("active");
            quizAnswers[listSubmit[currentIndex]].classList.add("incorrect");
        }
    }
}
