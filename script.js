"use strict";

import { svgAuto, svgDece } from "./svg.js";

const btnRecruit = document.querySelector(".btn-recruit");
const btnContainer = document.querySelector(".btn-container");
const cardsContainer = document.querySelector(".cards-container");
const modalWindow = document.querySelector(".modal-window");
const overlay = document.querySelector(".overlay");

let vehicleTypes = [];
let transformer;
let transformers = [];

class Transformer {
  constructor(faction, group, type, model) {
    this.faction = faction;
    this.group = group;
    this.type = type;
    this.model = model;
    this.weapons = [];
    this.id = Date.now();
    this.status = "ok";
  }
}

////Creates a new card, or re-creates an updated card

function createCard(tf, sibling = "none") {
  const weapons = [];
  tf.weapons.forEach((element) =>
    weapons.push(`<ul class="gear-item">
    ${element} 
  </ul>`)
  );

  const cardHTML = `
<div class="card" id="${tf.id}">

<button class="btn-delete">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="icon-delete"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <button class="btn-edit">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="icon-edit"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
</button>
${tf.faction == "Decepticons" ? svgDece : svgAuto}
<h2 class="secondary-header">${tf.faction}</h2>
<h3 class="tertiary-header">${tf.type} &mdash; ${tf.model}</h3>
<select class="status-selection" name="status" id="status">
  <option value="ok" class="status-value" ${
    tf.status === "ok" ? "selected" : ""
  }>OK</option>
  <option value="injured" class="status-value" ${
    tf.status === "injured" ? "selected" : ""
  }>Injured</option>
  <option value="mia" class="status-value" ${
    tf.status === "mia" ? "selected" : ""
  }>MIA</option>
</select>
<div class="gear-container">
  <span class="gear">Equipped gear:</span>
  <li class="gear-list">
    
  ${weapons.join(", ")}
  </li>
  <button type="button" class="btn-add-gear">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon-add"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
</div>
</div>
`;
  sibling === "none"
    ? cardsContainer.insertAdjacentHTML("beforeend", cardHTML)
    : sibling.insertAdjacentHTML("afterend", cardHTML);

  switch (tf.status) {
    case "ok":
      document
        .getElementById(tf.id)
        .querySelector(".status-selection").style.boxShadow =
        "0px 0px 15px rgba(0, 255, 0, 0.6)";
      break;
    case "injured":
      document
        .getElementById(tf.id)
        .querySelector(".status-selection").style.boxShadow =
        "0px 0px 15px rgb(255, 0, 0)";
      break;
    case "mia":
      document
        .getElementById(tf.id)
        .querySelector(".status-selection").style.boxShadow =
        "0px 3px 10px rgb(0 0 0 / 20%)";
      break;
  }
}

////Fetches faction info for recruiting function

const fetchFactions = async function () {
  const response = await fetch(
    "http://raw.githubusercontent.com/damirsehic/transformers-api/master/db.json"
  );
  const { factions } = await response.json();
  return factions.map((element) => element.name);
};

////Renders options provided to the function as buttons inside the modal window, clears window and resolves promise upon choosing

const renderOptions = function (options) {
  return new Promise(function (resolve) {
    options.forEach((element) => {
      btnContainer.insertAdjacentHTML(
        "beforeend",
        `<button class="btn-choice" type="submit" id="${element.replace(
          / /g,
          ""
        )}" value="${element}">${element.toUpperCase()}</button>`
      );
      document
        .querySelector(`#${element.replace(/ /g, "")}`)
        .addEventListener("click", function (e) {
          e.preventDefault();
          btnContainer.innerHTML = "";
          resolve(e.target.value);
        });
    });
  });
};

////Fetches vehicle data storing all vehicles in vehicleTypes array

const fetchGroups = async function () {
  const response = await fetch(
    "http://raw.githubusercontent.com/damirsehic/transformers-api/master/db.json"
  );
  const data = await response.json();
  vehicleTypes = data.vehicleTypes;
  return;
};

////Toggles modal window and the blur background

const toggleModal = function () {
  modalWindow.classList.toggle("hidden");
  overlay.classList.toggle("hidden");
};

////Creates a new transformer object and pushes it to the transformers array

const recruit = async function () {
  try {
    toggleModal();
    let options = await fetchFactions();
    let faction = await renderOptions(options);
    await fetchGroups();

    //Creates a set of unique group options, provides the choice and saves it

    let group = await renderOptions([
      ...new Set(vehicleTypes.map((element) => element.group)),
    ]);

    //Same as above but type, while also making sure only types in the selected group are offered

    let type = await renderOptions([
      ...new Set(
        vehicleTypes
          .filter((element) => element.group === group)
          .map((element) => element.type)
      ),
    ]);

    let model = await renderOptions([
      ...new Set(
        vehicleTypes
          .filter((element) => element.type === type)
          .map((element) => element.model)
      ),
    ]);
    transformer = new Transformer(faction, group, type, model);
    transformers.push(transformer);
    createCard(transformer);

    toggleModal();
  } catch (err) {
    console.error(`${err.message} An error happened`);
  }
  console.log("Successfully added.");
};

////Adds/removes gear for passed in card(transformer) and re-renders the card in its place upon update

const addGear = function (card) {
  const selectedTransformer = transformers.find(
    (element) => element.id === +card.id
  );
  selectedTransformer.weapons.push(window.prompt("Please input a weapon"));
  const sibling = card.previousElementSibling;
  card.remove();
  createCard(selectedTransformer, sibling);
};

const removeGear = function (e) {
  const targetWeaponArray = transformers.find(
    (element) => element.id === +e.closest(".card").id
  ).weapons;
  targetWeaponArray.splice(targetWeaponArray.indexOf(e.innerText), 1);
  e.nextSibling.remove();
  e.remove();
};

const deleteTransformer = function (target) {
  const index = transformers.findIndex((element) => element.id === +target.id);
  transformers.splice(index, 1);
  target.remove();
};

const applyFilter = function (value) {
  cardsContainer.innerHTML = "";
  transformers.forEach((element) => {
    if (value === "none") createCard(element);
    else if (element.faction == value) createCard(element);
  });
};

const editTransformer = async function (card) {
  const targetedTransformer = transformers.find(
    (element) => element.id === +card.id
  );

  toggleModal();
  const option = await renderOptions(["group", "type", "model"]);
  await fetchGroups();
  switch (option) {
    case "group":
      targetedTransformer.group = await renderOptions([
        ...new Set(vehicleTypes.map((element) => element.group)),
      ]);
    case "type":
      targetedTransformer.type = await renderOptions([
        ...new Set(
          vehicleTypes
            .filter((element) => element.group === targetedTransformer.group)
            .map((element) => element.type)
        ),
      ]);
    case "model":
      targetedTransformer.model = await renderOptions([
        ...new Set(
          vehicleTypes
            .filter((element) => element.type === targetedTransformer.type)
            .map((element) => element.model)
        ),
      ]);
      toggleModal();
      const sibling = card.previousElementSibling;
      card.remove();
      createCard(targetedTransformer, sibling);
      break;
  }
};

const applySearch = function (input) {
  cardsContainer.innerHTML = "";
  transformers.forEach((transformer) => {
    if (
      transformer.model.toLowerCase().includes(input.toLowerCase()) ||
      transformer.type.toLowerCase().includes(input.toLowerCase())
    )
      createCard(transformer);
  });
};

btnRecruit.addEventListener("click", function (e) {
  e.preventDefault();

  recruit();
});

document.body.addEventListener("click", function (e) {
  if (e.target.closest(".btn-add-gear")) addGear(e.target.closest(".card"));
  if (e.target.classList.contains("gear-item")) removeGear(e.target);
  if (e.target.closest(".btn-delete"))
    deleteTransformer(e.target.closest(".card"));
  if (e.target.closest(".btn-edit")) editTransformer(e.target.closest(".card"));
  if (e.target.classList.contains("overlay")) {
    toggleModal();
    btnContainer.innerHTML = "";
  }
});

document.body.addEventListener("change", function (e) {
  e.preventDefault();
  if (e.target.closest(".status-selection")) {
    const targetedTransformer = transformers.find(
      (element) => element.id === +e.target.closest(".card").id
    );

    const targetedStatus = e.target.closest(".status-selection");

    switch (e.target.closest(".status-selection").value) {
      case "ok":
        targetedTransformer.status = "ok";
        targetedStatus.style.boxShadow = "0px 0px 15px rgba(0, 255, 0, 0.6)";
        break;
      case "injured":
        targetedTransformer.status = "injured";
        targetedStatus.style.boxShadow = "0px 0px 15px rgb(255, 0, 0)";
        break;
      case "mia":
        targetedTransformer.status = "mia";
        targetedStatus.style.boxShadow = "0px 3px 10px rgb(0 0 0 / 20%)";
        break;
    }
  }
  const radioTarget = e.target.parentNode.querySelector(".filter-input");
  if (radioTarget) {
    applyFilter(radioTarget.value);
  }
});

document.querySelector(".search-bar").addEventListener("keyup", function (e) {
  applySearch(e.target.value);
});

window.addEventListener("beforeunload", function (e) {
  localStorage.setItem("transformers", JSON.stringify(transformers));
});

if (localStorage.transformers) {
  transformers = JSON.parse(localStorage.getItem("transformers"));
  transformers.forEach((ele) => createCard(ele));
}
(async function () {
  const response = await fetch(
    "http://raw.githubusercontent.com/damirsehic/transformers-api/master/db.json"
  );
  const data = await response.json();
  console.log(data.factions);
})();
