// ==UserScript==
// @name        Page 2 - diva-portal.org
// @namespace   Violentmonkey Scripts
// @match       https://kth.diva-portal.org/dream/add/add2.jsf
// @grant       none
// @version     1.1
// @author      Baltzar Lagerros
// @description Various extra goodies for Diva
// ==/UserScript==
window.addEventListener('load', function() {
    // Create a button based on name an onclick function
    getButton = (name, func) => {
        let bttn = document.createElement("input");
        bttn.setAttribute("type", "button");
        bttn.setAttribute("value", name);
        if (typeof func == "string") {
            bttn.setAttribute("onclick", func);
        } else {
            bttn.onclick = func;
        }
        return bttn;
    };

    // https://stackoverflow.com/questions/9515704/use-a-content-script-to-access-the-page-context-variables-and-functions/9517879#9517879
    saveForm = () => {
        let s = document.createElement('script');
        s.src = chrome.runtime.getURL('tinyMCE.js');
        s.onload = function() {
            this.remove();
        };
        (document.head || document.documentElement).appendChild(s);
    }

    // Add English and Swedish button based on the input element.
    addLanguageButton = (langButton) => {
        let parent = langButton.parentElement.parentElement;
        let swedishBtt = getButton("Svenska", function() {
            langButton.selectedIndex = 2;
            saveForm();
        });
        let englishBtt = getButton("Engelska", function() {
            langButton.selectedIndex = 1;
            saveForm();
        });
        parent.appendChild(swedishBtt);
        parent.appendChild(englishBtt);
    };


    // Looks through all elements containing "Language:" and adds a language selector for Swedish and English.
    addAllLanguageButtons = () => {
        console.log("Added all Language Buttons!");
        document.querySelectorAll("div.diva2addtextchoicecol").forEach(element => {
            if ((element.innerText.includes('Language:') || element.innerText.includes('Språk:')) && element.parentElement.querySelector("#languageButton") == null) {
                let button = element.parentElement.querySelector("div.diva2addtextchoicebox > select");
                button.id = "languageButton";
                addLanguageButton(button);
            }
        });
    };

    // Adds a paste text button based on a container element.
    setPasteButton = (container) => {
        let parent = container.querySelector("div.tox-toolbar__primary");
        let pasteButton = getButton("[Paste]",
            function() {
                let textHtml = container.querySelector("iframe").contentWindow.document.querySelector("body");
                navigator.clipboard.readText()
                    .then(text => {
                        console.log('Pasted content: ', text);
                        // We dont want newlines or abstract in the start.
                        let abstractRemoval = /^\s*abstract/gmi;
                        let sammanfattningRemoval = /^\s*sammanfattning/gmi;
                        var modifiedText = text
                            .replaceAll("\n", " ")
                            .replace(abstractRemoval, "")
                            .replace(sammanfattningRemoval, "");

                        textHtml.innerText = modifiedText.trim();
                    })
                    .catch(err => {
                        console.error('Failed to read clipboard contents: ', err);
                    });
            });

        // Prevents adding the button twice!
        pasteButton.id = "pasteButton";
        if (parent.querySelector("#pasteButton") == null) {
            parent.appendChild(pasteButton);
        };
    };

    // Sets the exam level and the corresponding points, only points for kandidat and master coded so far.
    setExamLevel = (level, examPoints) => {
        examLevel.selectedIndex = level;
        if (level == 4) {
            examPoints.selectedIndex = 13;
        } else if (level == 7) {
            examPoints.selectedIndex = 5;
        };
    };

    // Adds all master/kandidat buttons
    addAllMasterButtons = () => {
        examLevels = document.querySelectorAll("select[name*='level']");
        examPoints = document.querySelectorAll("select[name*='creditsSelectMenu']");

        for (let i = 0; i < examLevels.length; i++) {
            // Do not add the element twice!
            if (document.querySelector(`#masterButtonButton${i}`) == null) {
                let masterButton = getButton("Master", () => {
                    examLevels[i].selectedIndex = 4;
                    examPoints[i].selectedIndex = 13;
                });
                masterButton.id = `masterButtonButton${i}`
                examLevels[i].parentElement.parentElement.appendChild(masterButton);
            }

            if (document.querySelector(`#kandidatButton${i}`) == null) {
                let kandidatButton = getButton("Kandidat", () => {
                    examLevels[i].selectedIndex = 7;
                    examPoints[i].selectedIndex = 5;
                });
                kandidatButton.id = `kandidatButton${i}`
                examLevels[i].parentElement.parentElement.appendChild(kandidatButton);
            }
        };
        document.querySelectorAll("div.tox-editor-container").forEach(container => setPasteButton(container));
    };
    addAllMasterButtons();



    // Allows you to paste data copied from TRITA!
    addPasteTrita = () => {
        let globalPaste = document.querySelector("div[id='addForm:authorSerie']");
        let pasteButton = getButton("[Paste Personal Info]", function() {
            navigator.clipboard.readText()
                .then(text => {
                    // When copied from Excel it's spaced with tabs.
                    let split = text.split("\t");
                    console.log('Pasted content: ', split);
                    try {
                        if (split[0].startsWith("TRITA")) {
                            // Splits names by "and" and ","
                            let separationRegex = /(?:\s+and\s+|\s*,\s*)/
                            // The extra timeout between clicking the examiner/supervisor button 
                            // and accessing the element. Cannot be 0 because they layout takes time to generate.
                            let timeout = 2000;

                            // Saves the trita for the pdf button.
                            document.trita = split[0];

                            // Set year.
                            let tritaYear = split[0].match(/\d{4}/g);
                            if (tritaYear.length > 0) {
                                document.querySelector("#diva2addcontainer > div.diva2addtextmain.diva2maincolor > div.diva2addtextmainer > div.diva2addtextbotmargin > div.diva2addtextbotmargin > div:nth-child(9) > fieldset > div.diva2addtextplus5 > div.diva2addtextplus3 > div.diva2addtextchoicebox > input").
                                value = tritaYear[0];
                                document.querySelector("input[id='addForm:atYear']").value = tritaYear[0];
                            }

                            // Open PDF button, only adds the button once.
                            if (document.querySelector("#open-pdf") == null) {
                                let pdfButton = getButton("[Open PDF]", function() {
                                    console.log(document.trita);
                                    let tritaYear = document.trita.match(/\d{4}/g)[0];
                                    window.open(`https://kth-my.sharepoint.com/personal/angbri_ug_kth_se/Documents/PDF-%20Exjobb/${tritaYear}/${document.trita.replace(":", "-")}.pdf`, '_blank');
                                });
                                pdfButton.id = "open-pdf";
                                globalPaste.prepend(pdfButton);
                            };

                            // Takes in a full name, splits it and sets the appropiate value in the elements
                            // defined by the selector
                            let addName = (name, firstNameSelector, lastNameSelector) => {
                                let firstName = name.split(" ")[0];
                                let lastName = name.split(" ").splice(1).join(" ").trim();
                                Array.from(document.querySelectorAll(firstNameSelector)).pop().value = firstName;
                                Array.from(document.querySelectorAll(lastNameSelector)).pop().value = lastName;
                            };

                            let addYear = (personalNumber, yearSelector) => {
                                console.log(personalNumber);
                                // Personal number can be YYMMDD-XXXX or YYYYMMDD-XXXX
                                let isSmallNumber = personalNumber.length == 11 || personalNumber.split(/\s*-\s*/)[0].trim().length == 6;

                                let year;

                                // If personal number is YYMMDD-XXXX then do math to figure out the year.
                                if (isSmallNumber) {
                                    let latterYearDigits = personalNumber.substr(0, 2);
                                    let firstYearDigits = (new Date().getFullYear() - parseInt(latterYearDigits)).toString().substr(0, 2);
                                    year = firstYearDigits + latterYearDigits;
                                } else {
                                    year = personalNumber.substr(0, 4);
                                };

                                document.querySelector(yearSelector).value = year;
                            };

                            // Set names.
                            let fullNames = split[1].split(separationRegex);

                            // Set bith year.
                            let personalNumbers = split[2].split(separationRegex);

                            // Bad code duplication :(
                            // This basically loops over each name and adds more authors if the html element does not exist.
                            fullNames.forEach((name, index) => {
                                let firstNameSelector = `input[id='addForm:authorSerie:${index}:autGiven']`;
                                let lastNameSelector = `input[id='addForm:authorSerie:${index}:autFamily']`;
                                let yearSelector = `input[id='addForm:authorSerie:${index}:autBirthYear']`

                                let noElements = document.querySelectorAll(firstNameSelector).length == 0;
                                let personalNumber = personalNumbers[index];

                                // If the input box is not available then click the "Add examiner" button and then
                                // add the appropiate name.
                                if (noElements) {
                                    setTimeout(() => {
                                        let authorButton = Array.from(document.querySelectorAll("input.iceCmdBtn.diva2addsokbutton.diva2backgroundcolor"))
                                            .filter(element => element.value.includes("author"))[0];
                                        authorButton?.click();
                                    }, timeout * index);
                                    // Because all iterations of names fire at roughly the same time we need to separate them in
                                    // time with timeout * index as to not make them interfere with each other.
                                    setTimeout(() => {
                                        addName(name, firstNameSelector, lastNameSelector);
                                        addYear(personalNumber, yearSelector);
                                    }, timeout * index + timeout);
                                } else {
                                    addName(name, firstNameSelector, lastNameSelector);
                                    addYear(personalNumber, yearSelector);
                                }
                            });


                            // TODO!
                            let program = split[3];
                            let courseCode = split[4];

                            let examinerNames = split[5];
                            let allExaminerNames = examinerNames.split(separationRegex);

                            allExaminerNames.forEach((name, index) => {
                                let examinerFirstNameSelector = `input[id='addForm:examinerSerie:${index}:examinerGiven']`;
                                let examinerLastNameSelector = `input[id='addForm:examinerSerie:${index}:examinerFamily']`;
                                let noElements = document.querySelectorAll(examinerFirstNameSelector).length == 0;

                                // If the input box is not available then click the "Add examiner" button and then
                                // add the appropiate name.
                                if (noElements) {
                                    setTimeout(() => {
                                        let examinerButton = Array.from(document.querySelectorAll("input.iceCmdBtn.diva2addsokbutton.diva2backgroundcolor"))
                                            .filter(element => element.value.includes("examiner"))[0];
                                        examinerButton?.click();
                                    }, timeout * index);
                                    // Because all iterations of names fire at roughly the same time we need to separate them in
                                    // time with timeout * index as to not make them interfere with each other.
                                    setTimeout(() => {
                                        addName(name, examinerFirstNameSelector, examinerLastNameSelector);
                                    }, timeout * index + timeout);
                                } else addName(name, examinerFirstNameSelector, examinerLastNameSelector);
                            });

                            let supervisorNames = split[6];
                            let allSupervisorNames = supervisorNames.split(separationRegex);

                            allSupervisorNames.forEach((name, index) => {
                                let supervisorFirstNameSelector = `input[id='addForm:supervisorSerie:${index}:supGiven']`;
                                let supervisorLastNameSelector = `input[id='addForm:supervisorSerie:${index}:supFamily']`;
                                let noElements = document.querySelectorAll(supervisorFirstNameSelector).length == 0;

                                if (noElements) {
                                    setTimeout(() => {
                                        let supervisorButton = Array.from(document.querySelectorAll("input.iceCmdBtn.diva2addsokbutton.diva2backgroundcolor"))
                                            .filter(element => element.value.includes("supervisor"))[0];
                                        supervisorButton?.click();
                                    }, timeout * index);
                                    setTimeout(() => {
                                        addName(name, supervisorFirstNameSelector, supervisorLastNameSelector);
                                    }, timeout * index + timeout);
                                } else addName(name, supervisorFirstNameSelector, supervisorLastNameSelector);
                            });

                        }
                    } catch (err) {
                        console.error('Failed [Paste Personal Info]: ', err);
                    }

                })
                .catch(err => {
                    console.error('Failed to read clipboard contents: ', err);
                });
        });

        // Prevent re-adding the button
        let id = "pasteTrita";
        pasteButton.id = id;
        if (document.querySelectorAll(`#${id}`).length == 0) {
            globalPaste.prepend(pasteButton);
        };
    };

    addPasteTrita();

    addAllPasteButtons = () => {
        // Adds paste buttons to all elements.
        document.querySelectorAll("div.tox-editor-container").forEach(container => setPasteButton(container));
    };

    // When abstracts get removed or added the Custom elements (paste and languages) gets deleted, we need to re-add them.
    // Only run this function once in init!
    updateButtonsOnUpdatedDocument = () => {
        // This basically hooks the "Another abstract" and X buttons to re-add all paste buttons.
        // The problem is that both buttons gets updated once one is clicked, so we need to run updateHooks()
        // and updateAllHookedElements() every time either button is clicked.

        let onClickHooks = [];

        updateHooks = () => {
            // Clear the array
            onClickHooks.length = 0;
            console.log("Abstract button updated.");
            // Get the first button with abstract in the name, the "Another Abstract" button.
            let abstractButton = Array.from(document.querySelectorAll("input.iceCmdBtn.diva2addsokbutton.diva2backgroundcolor"))
                .filter(element => element.value.includes("abstract") || element.value.includes("Legg til fritextbeskrivning"))[0];
            let removalButton = abstractButton.parentElement.parentElement.parentElement.querySelector("div.diva2addtextsquare > a.iceCmdLnk.diva2addtextend");
            onClickHooks.push(abstractButton);
            onClickHooks.push(removalButton);

            let addExamButton = Array.from(document.querySelectorAll("input.diva2addsokbutton.diva2backgroundcolor"))
                .filter(element => element.value.includes("Another degree") || element.value.includes("Ytterligare examen") || element.value.includes("Legg til eksamen"))[0];
            let examRemovalButton = addExamButton.parentElement.parentElement.querySelector("div.diva2addtextsquare > a.diva2addtextend");
            onClickHooks.push(addExamButton);
            if (examRemovalButton != null) {
                onClickHooks.push(examRemovalButton);
            };

            let addAuthorButton = Array.from(document.querySelectorAll("input.diva2addsokbutton.diva2backgroundcolor"))
                .filter(element => element.value.includes("Another author") || element.value.includes("Ytterligare författare") || element.value.includes("Legg til forfatter"))[0];

            onClickHooks.push(addAuthorButton);
            onClickHooks = onClickHooks.concat(Array.from(document.querySelectorAll(`a[id*='removePerson']`)));
        };

        // Appends another function to the element which runs when the original onclick is completed.
        // Needs to be done with addEventListener because extensions cannot look at document functions.
        addFunctionToElement = (element, newFunc) => {
            element.addEventListener("click",
                function() {
                    newFunc();
                }
            );

            /*
            element.onclick = (() => {
                let cachedFunction = element.onclick;
                console.log("cachedFunction");
                console.log(cachedFunction);
                return function () {
                    var result = cachedFunction.apply(this, arguments);
                    newFunc();
                    return result;
                };
            })();*/
        };


        updateAllHookedElements = () => {
            onClickHooks.forEach(element => {
                addFunctionToElement(element, () => {
                    console.log("Hooked element clicked, dispatching document updates.");
                    setTimeout(() => {
                        // Terrible race condition
                        addAllPasteButtons();
                        addAllLanguageButtons();
                        addPasteTrita();
                        updateHooks();
                        updateAllHookedElements();
                        addAllMasterButtons();
                    }, 1000);
                });
            });
        };

        updateHooks();
        updateAllHookedElements();
    };
    updateButtonsOnUpdatedDocument();

    addAllLanguageButtons();
    addAllPasteButtons();

    // Other information > Year
    // Adds a currrent year button
    // Somewhat redundant with the TRITA adder
    let yearContainer = document.querySelector("#diva2addcontainer > div.diva2addtextmain.diva2maincolor > div.diva2addtextmainer > div.diva2addtextbotmargin > div.diva2addtextbotmargin > div:nth-child(9)");
    let yearButton = getButton(new Date().getFullYear(), function() {
        let yearInput = document.querySelector("#diva2addcontainer > div.diva2addtextmain.diva2maincolor > div.diva2addtextmainer > div.diva2addtextbotmargin > div.diva2addtextbotmargin > div:nth-child(9) > fieldset > div.diva2addtextplus5 > div.diva2addtextplus3 > div.diva2addtextchoicebox > input");
        yearInput.value = new Date().getFullYear();
    });
    yearContainer.appendChild(yearButton);
}, false);