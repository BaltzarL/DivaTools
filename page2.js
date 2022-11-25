// ==UserScript==
// @name        Page 2 - diva-portal.org
// @namespace   Violentmonkey Scripts
// @match       https://kth.diva-portal.org/dream/add/add2.jsf
// @grant       none
// @version     1.1
// @author      Baltzar Lagerros
// @description Various extra goodies for Diva
// ==/UserScript==

// Timeout between changes in document
// cant really make this much lower because abstracts take some time to add.
const timeout = 2000;

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
        });
        let englishBtt = getButton("Engelska", function() {
            langButton.selectedIndex = 1;
        });
        parent.appendChild(swedishBtt);
        parent.appendChild(englishBtt);
    };


    // Looks through all elements containing "Language:" and adds a language selector for Swedish and English.
    addAllLanguageButtons = () => {
        console.log("Added all Language Buttons!");
        document.querySelectorAll("div.diva2addtextchoicecol").forEach(element => {
            if ((element.innerText.includes('Language:') || element.innerText.includes('Språk:')) && element.parentElement.querySelector(".languageButton") == null) {
                let button = element.parentElement.querySelector("div.diva2addtextchoicebox > select");
                button.classList.add("languageButton");
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
                    examLevels[i].selectedIndex = 2;
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

    // Adds the course and program save buttons
    addCourseProgramButtons = () => {
        // Since they lack presistent ids for the element I'll just use the option value
        // if this function breaks in the future just check these selectors
        educationalProgramOptions = document.querySelectorAll("option[value='10522']");
        subjectOptions = document.querySelectorAll("option[value='10260']");

        for (let i = 0; i < educationalProgramOptions.length; i++) {
            // Do not add the element twice!
            if (document.querySelector(`#subjectButton${i}`) == null) {
                let savedName = localStorage.getItem("SavedSubjectName") ?? "None saved";

                let subjectButton = getButton(savedName, () => {
                    let currentSaved = localStorage.getItem("SavedSubjectValue") ?? "-1";
                    educationalProgramOptions[i].parentElement.value = currentSaved;
                });

                subjectButton.id = `subjectButton${i}`
                let subjectContainer = educationalProgramOptions[i].parentElement.parentElement.parentElement
                subjectContainer.style.display = "flex";
                subjectContainer.style.alignItems = "stretch";
                subjectContainer.style.flexDirection = "column-reverse";
                subjectContainer.style.gap = "10px";
                educationalProgramOptions[i].parentElement.style.width = "100%";

                let subjectSaveButton = getButton("Save", () => {
                    let currentOption = educationalProgramOptions[i].parentElement?.value;
                    let currentName = educationalProgramOptions[i].parentElement.selectedOptions[0]?.text?.trim();
                    localStorage.setItem("SavedSubjectValue", currentOption);
                    localStorage.setItem("SavedSubjectName", currentName);
                    subjectButton.value = currentName;
                });
                subjectSaveButton.id = `subjectSaveButton${i}`

                subjectContainer.appendChild(subjectSaveButton);
                subjectContainer.appendChild(subjectButton);
            };
            if (document.querySelector(`#programButton${i}`) == null) {
                let savedName = localStorage.getItem("SavedProgramName") ?? "None saved";

                let programButton = getButton(savedName, () => {
                    let currentSaved = localStorage.getItem("SavedProgramValue") ?? "-1";
                    subjectOptions[i].parentElement.value = currentSaved;
                });

                programButton.id = `programButton${i}`

                let programSaveButton = getButton("Save", () => {
                    let currentOption = subjectOptions[i].parentElement?.value;
                    let currentName = subjectOptions[i].parentElement.selectedOptions[0]?.text?.trim();
                    localStorage.setItem("SavedProgramValue", currentOption);
                    localStorage.setItem("SavedProgramName", currentName);
                    programButton.value = currentName;
                });
                programSaveButton.id = `programSaveButton${i}`
                let programContainer = subjectOptions[i].parentElement.parentElement.parentElement

                programContainer.appendChild(programSaveButton);
                programContainer.appendChild(programButton);

                programContainer.style.display = "flex";
                programContainer.style.alignItems = "stretch";
                programContainer.style.flexDirection = "column-reverse";
                programContainer.style.gap = "10px";
                subjectOptions[i].parentElement.style.width = "100%";
            };
        };
    };

    addCourseProgramButtons();

    findElementsByText = (selector, ...texts) => {
        return Array.from(document.querySelectorAll(selector))
            .filter(element => texts.some((text) => element.innerText.includes(text)));
    };

    findElementsByValue = (selector, ...values) => {
        return Array.from(document.querySelectorAll(selector))
            .filter(element => values.some((value) => element.value.includes(value)));
    };

    // Sets a name in the authority name popup.
    setAuthoryName = (name) => {
        let input = document.querySelector("div.diva2orginputbox input");
        if (input) input.value = name;
    };

    // Adds [Search name] buttons next to all authority records to quickly search the entered name.
    addAllAuthorityButtons = () => {
        findElementsByValue("input.iceCmdBtn.diva2addsokbuttonperson.diva2backgroundcolor", "authority record", "personpost").forEach((element) => {
            let searchClass = "searchButton"

            let searchButton = getButton("Search name", function() {
                let box = element.parentElement.parentElement.parentElement;
                let names = box.querySelectorAll("div.diva2addtextplusname input");
                let firstName = names[0]?.value ?? "";
                let lastName = names[1]?.value ?? "";
                let fullName = `${firstName} ${lastName}`.trim();
                element.click();

                // Takes some time for the popup to appear
                setTimeout(() => {
                    setAuthoryName(fullName);
                }, timeout);
            });
            searchButton.classList.add(searchClass);

            if (element.parentElement.querySelectorAll("." + searchClass).length == 0) {
                element.parentElement.appendChild(searchButton);
            };
        });
    };

    // Allows you to paste data copied from TRITA!
    addPasteTrita = () => {
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

                            // Saves the trita for the pdf button.
                            document.trita = split[0];

                            // Set ISSN series ----------------

                            // Do not do anything if there is already a series added.
                            if (document.querySelectorAll("input[id*='0:seriesNumber']").length == 0) {
                                // Do this last because otherwise it will interfere with supervisor/examiner pasting!
                                setTimeout(() => {
                                    let issnText = findElementsByText("div.diva2addtextplus5 > div", "/ISSN")[0];
                                    let issSelector = issnText.parentElement.parentElement.querySelectorAll("select")[0];

                                    // Hardcoded TRITA-EECS-EX, searches for the option with that name.
                                    let issIndex = Array.from(issSelector.options).filter(option => option.innerText.includes("TRITA-EECS-EX"))[0]?.index ?? -1;
                                    issSelector.selectedIndex = issIndex;
                                    let evt = document.createEvent("HTMLEvents");
                                    // Setting a smaller timeout will make it activate the button twice if you have multiple authors!
                                    evt.initEvent("change", false, true);
                                    issSelector.dispatchEvent(evt);
                                }, timeout * 1.5);

                                // Do this after the element has been added.
                                setTimeout(() => {
                                    let seriesNumberInput = document.querySelector("input[id*='0:seriesNumber']");
                                    // Get trita number: TRITA-EECS-EX-2022:123 -> 2022:123
                                    seriesNumberInput.value = split[0].split("-").pop(); //.match(/.*:(\d+)/)[1];
                                }, timeout * 4);
                            };

                            // ---------------------------------

                            // Set year.
                            let tritaYear = split[0].match(/\d{4}/g);
                            if (tritaYear.length > 0) {
                                document.querySelector("#diva2addcontainer > div.diva2addtextmain.diva2maincolor > div.diva2addtextmainer > div.diva2addtextbotmargin > div.diva2addtextbotmargin > div:nth-child(9) > fieldset > div.diva2addtextplus5 > div.diva2addtextplus3 > div.diva2addtextchoicebox > input").
                                value = tritaYear[0];
                                document.querySelector("input[id='addForm:atYear']").value = tritaYear[0];
                            }

                            addOpenPdfButton();

                            // Takes in a full name, splits it and sets the appropiate value in the elements
                            // defined by the selector
                            let addName = (name, firstNameSelector, lastNameSelector) => {
                                let firstName = name.split(" ")[0];
                                let lastName = name.split(" ").splice(1).join(" ").trim();
                                Array.from(document.querySelectorAll(firstNameSelector)).pop().value = firstName;
                                Array.from(document.querySelectorAll(lastNameSelector)).pop().value = lastName;
                            };

                            let addYear = (personalNumber, yearSelector) => {
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
                                        let authorButton = findElementsByValue("input.iceCmdBtn.diva2addsokbutton.diva2backgroundcolor", "author", "författare", "forfatter")[0];
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
                                        let examinerButton = findElementsByValue("input.iceCmdBtn.diva2addsokbutton.diva2backgroundcolor", "examiner", "examinator", "eksaminator")[0];
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
                                        let supervisorButton = findElementsByValue("input.iceCmdBtn.diva2addsokbutton.diva2backgroundcolor", "supervisor", "veileder", "handledare")[0];
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
        let globalPaste = document.querySelector("div[id='addForm:authorSerie']");
        if (document.querySelectorAll(`#${id}`).length == 0) {
            globalPaste?.prepend(pasteButton);
        };
    };

    addPasteTrita();

    addOpenPdfButton = () => {
        // Open PDF button, only adds the button once.
        if (document.querySelector("#open-pdf") == null && document.trita) {
            let globalPaste = document.querySelector("div[id='addForm:authorSerie']");
            let pdfButton = getButton("[Open PDF]", function() {
                console.log(document.trita);
                let tritaYear = document.trita.match(/\d{4}/g)[0];
                window.open(`https://kth-my.sharepoint.com/personal/angbri_ug_kth_se/Documents/PDF-%20Exjobb/${tritaYear}/${document.trita.replace(":", "-")}.pdf`, '_blank');
            });
            pdfButton.id = "open-pdf";
            globalPaste.prepend(pdfButton);
        };
    };

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
            let abstractButton = findElementsByValue("input.iceCmdBtn.diva2addsokbutton.diva2backgroundcolor", "abstract", "fritextbeskrivning")[0];

            //let removalButton = abstractButton.parentElement.parentElement.parentElement.querySelector("div.diva2addtextsquare > a.iceCmdLnk.diva2addtextend");
            onClickHooks.push(abstractButton);
            //onClickHooks.push(removalButton);

            let addExamButton = findElementsByValue("input.diva2addsokbutton.diva2backgroundcolor", "Another degree", "Ytterligare examen", "Legg til eksamen")[0];

            //let examRemovalButton = addExamButton.parentElement.parentElement.querySelector("div.diva2addtextsquare > a.diva2addtextend");
            onClickHooks.push(addExamButton);
            //if (examRemovalButton != null) {
            //    onClickHooks.push(examRemovalButton);
            //};

            let addAuthorButton = findElementsByValue("input.diva2addsokbutton.diva2backgroundcolor", "Another author", "Ytterligare författare", "Legg til forfatter")[0];

            onClickHooks.push(addAuthorButton);
            let keywords = Array.from(document.querySelectorAll("input.iceCmdBtn.diva2addsokbutton.diva2backgroundcolor[id*='addForm:keywordList:']")).pop();
            let keywordsDeleteButton = Array.from(document.querySelectorAll("a.iceCmdLnk.diva2addtextend[id*='addForm:keywordList:']")).pop();

            onClickHooks.push(keywords);
            onClickHooks.push(keywordsDeleteButton);

            let examinerButton = findElementsByValue("input.iceCmdBtn.diva2addsokbutton.diva2backgroundcolor", "examiner", "examinator", "eksaminator")[0];
            onClickHooks.push(examinerButton);

            let supervisorButton = findElementsByValue("input.iceCmdBtn.diva2addsokbutton.diva2backgroundcolor", "supervisor", "veileder", "handledare")[0];
            onClickHooks.push(supervisorButton);

            onClickHooks = onClickHooks.concat(Array.from(document.querySelectorAll(`a[id*='removePerson']`)));

            // Adds all the removal buttons.
            onClickHooks = onClickHooks.concat(Array.from(document.querySelectorAll(`div.diva2addtextsquare > a`)));
        };

        // Appends another function to the element which runs when the original onclick is completed.
        // Needs to be done with addEventListener because extensions cannot look at document functions.
        addFunctionToElement = (element, newFunc) => {
            element.addEventListener("click",
                function() {
                    newFunc();
                }
            );
        };


        updateAllHookedElements = () => {
            onClickHooks.forEach(element => {
                if (!element) return;
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
                        addCourseProgramButtons();
                        addOpenPdfButton();
                    }, timeout);
                });
            });
        };

        updateHooks();
        updateAllHookedElements();
    };
    updateButtonsOnUpdatedDocument();

    addAllLanguageButtons();
    addAllPasteButtons();

    addAllAuthorityButtons();
    // This is needed since searching for authorities removes this button and it's hard to hook that.
    const addAllAuthorityButtonsLoop = () => setTimeout(() => {
        addAllAuthorityButtons();
        addAllAuthorityButtonsLoop();
    }, timeout * 5);
    addAllAuthorityButtonsLoop();

    // Other information > Year
    // Adds a currrent year button
    // Somewhat redundant with the TRITA adder
    let yearContainer = document.querySelector("#diva2addcontainer > div.diva2addtextmain.diva2maincolor > div.diva2addtextmainer > div.diva2addtextbotmargin > div.diva2addtextbotmargin > div:nth-child(9)");
    let yearButton = getButton(new Date().getFullYear(), function() {
        let yearInput = document.querySelector("#diva2addcontainer > div.diva2addtextmain.diva2maincolor > div.diva2addtextmainer > div.diva2addtextbotmargin > div.diva2addtextbotmargin > div:nth-child(9) > fieldset > div.diva2addtextplus5 > div.diva2addtextplus3 > div.diva2addtextchoicebox > input");
        yearInput.value = new Date().getFullYear();
    });
    yearContainer?.appendChild(yearButton);
}, false);