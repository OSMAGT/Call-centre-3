
// =====================================
// CONFIGURATION
// =====================================

const CENTERS = [
"Reghaia",
"Baraki",
"Bougara",
"Santé",
"Ain Benian"
];

const STORAGE_KEY = "clinic_call_center_stats_v1";

let records = loadData();

const $ = id => document.getElementById(id);

function getToday(){

const d = new Date();

return d.getFullYear()+"-"+
String(d.getMonth()+1).padStart(2,"0")+"-"+
String(d.getDate()).padStart(2,"0");

}

const today = getToday();

// =====================================
// STORAGE
// =====================================

function loadData(){

try{
return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}catch{
return [];
}

}

function saveData(){

localStorage.setItem(STORAGE_KEY,JSON.stringify(records));

}

function incoming(r){

return r.answered + r.missed;

}

function numberValue(value){

const n = Number(value);

return Number.isInteger(n) && n >= 0 ? n : null;

}

// =====================================
// CENTERS
// =====================================

function initializeCenters(){

["center","reportCenter","filterCenter"].forEach(id=>{

CENTERS.forEach(name=>{

const option = document.createElement("option");

option.value = name;
option.textContent = name;

$(id).appendChild(option);

});

});

}

// =====================================
// NAVIGATION
// =====================================

document.querySelectorAll(".tab").forEach(button=>{

button.addEventListener("click",()=>{

const page = button.dataset.page;

document.querySelectorAll(".view").forEach(section=>{

section.classList.toggle("hidden",section.id !== page);

});

document.querySelectorAll(".tab").forEach(tab=>{

tab.classList.toggle("active",tab === button);

});

if(page === "dashboard") renderDashboard();
if(page === "records") renderHistory();

});

});

// =====================================
// PERIOD CALCULATION
// =====================================

function getPeriod(type,dateValue){

const d = new Date(dateValue + "T12:00:00");

let start = new Date(d);
let end = new Date(d);

// 15 JOURS

if(type === "15days"){

start = new Date(d);

start.setDate(d.getDate()-14);

end = new Date(d);

}

// WEEK

if(type === "week"){

const day = (d.getDay()+6)%7;

start.setDate(d.getDate()-day);

end = new Date(start);

end.setDate(start.getDate()+6);

}

// MONTH

if(type === "month"){

start = new Date(d.getFullYear(),d.getMonth(),1);

end = new Date(d.getFullYear(),d.getMonth()+1,0);

}

// YEAR

if(type === "year"){

start = new Date(d.getFullYear(),0,1);

end = new Date(d.getFullYear(),11,31);

}

function format(x){

return x.getFullYear()+"-"+
String(x.getMonth()+1).padStart(2,"0")+"-"+
String(x.getDate()).padStart(2,"0");

}

return [format(start),format(end)];

}

// =====================================
// CALCULATIONS
// =====================================

function sum(rows){

return rows.reduce((result,r)=>{

result.answered += r.answered;
result.missed += r.missed;
result.transferred += r.transferred;

return result;

},{answered:0,missed:0,transferred:0});

}

function percentage(data){

const total = data.answered + data.missed;

return total ? Math.round(data.answered/total*100) : 0;

}

// =====================================
// DASHBOARD
// =====================================

function renderDashboard(){

const type = $("period").value;

const date = $("reportDate").value || today;

const center = $("reportCenter").value;

let start,end;

// CUSTOM PERIOD

if(type === "custom"){

start = $("startDate").value;
end = $("endDate").value;

if(!start || !end || start > end){

$("total").textContent = 0;
$("answered").textContent = 0;
$("missed").textContent = 0;
$("transferred").textContent = 0;
$("rate").textContent = "0%";

$("centerTable").innerHTML =
"<tr><td colspan='6'>Veuillez sélectionner une période valide.</td></tr>";

return;

}

}else{

[start,end] = getPeriod(type,date);

}

// FILTER RECORDS

const rows = records.filter(r=>

r.date >= start &&
r.date <= end &&
(center === "all" || r.center === center)

);

// CALCULATIONS

const data = sum(rows);

$("total").textContent = data.answered + data.missed;

$("answered").textContent = data.answered;

$("missed").textContent = data.missed;

$("transferred").textContent = data.transferred;

$("rate").textContent = percentage(data)+"%";

// STATISTICS BY CENTER

$("centerTable").innerHTML = CENTERS

.filter(c=>center === "all" || c === center)

.map(c=>{

const s = sum(rows.filter(r=>r.center === c));

return `<tr>
<td>${c}</td>
<td>${s.answered+s.missed}</td>
<td>${s.answered}</td>
<td>${s.missed}</td>
<td>${s.transferred}</td>
<td>${percentage(s)}%</td>
</tr>`;

}).join("");

}

// =====================================
// DASHBOARD FILTERS
// =====================================

$("refresh").addEventListener("click",renderDashboard);

["reportDate","reportCenter"].forEach(id=>{

$(id).addEventListener("change",renderDashboard);

});

// CUSTOM PERIOD DISPLAY

$("period").addEventListener("change",function(){

const custom = this.value === "custom";

$("startDateGroup").classList.toggle("hidden",!custom);

$("endDateGroup").classList.toggle("hidden",!custom);

$("reportDateGroup").classList.toggle("hidden",custom);

if(custom){

$("startDate").value = today;

$("endDate").value = today;

}

renderDashboard();

});

$("startDate").addEventListener("change",renderDashboard);

$("endDate").addEventListener("change",renderDashboard);

// =====================================
// SAVE CALL RECORD
// =====================================

$("form").addEventListener("submit",event=>{

event.preventDefault();

const answered = numberValue($("a").value);

const missed = numberValue($("m").value);

const transferred = numberValue($("t").value);

const message = $("message");

message.className = "message";

if(answered === null || missed === null || transferred === null){

message.textContent = "Veuillez saisir des nombres valides.";

message.classList.add("err");

return;

}

if(transferred > answered){

message.textContent = "Les appels transférés ne peuvent pas dépasser les appels répondus.";

message.classList.add("err");

return;

}

const record = {

id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),

date: $("date").value,

center: $("center").value,

answered,

missed,

transferred,

notes: $("notes").value.trim()

};

if(!record.date){

message.textContent = "Veuillez sélectionner une date.";

message.classList.add("err");

return;

}

const index = records.findIndex(r=>

r.date === record.date &&
r.center === record.center

);

if(index !== -1){

if(!confirm("Un enregistrement existe déjà pour cette date et ce centre. Voulez-vous le remplacer ?")) return;

record.id = records[index].id;

records[index] = record;

}else{

records.push(record);

}

saveData();

event.target.reset();

$("date").value = today;

message.textContent = "Enregistrement effectué avec succès.";

message.classList.add("ok");

renderDashboard();

renderHistory();

});

// =====================================
// HISTORY
// =====================================

function escapeHTML(value){

return String(value).replace(/[&<>"']/g,c=>({

"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#39;"

})[c]);

}

function renderHistory(){

const from = $("from").value;

const to = $("to").value;

const center = $("filterCenter").value;

const rows = records.filter(r=>

(!from || r.date >= from) &&
(!to || r.date <= to) &&
(center === "all" || r.center === center)

).sort((a,b)=>b.date.localeCompare(a.date));

$("history").innerHTML = rows.map(r=>`

<tr>
<td>${escapeHTML(r.date)}</td>
<td>${escapeHTML(r.center)}</td>
<td>${r.answered}</td>
<td>${r.missed}</td>
<td>${r.transferred}</td>
<td>${incoming(r)}</td>
<td>${escapeHTML(r.notes || "")}</td>
<td>
<button class="small-btn edit" onclick="editRecord('${r.id}')">Modifier</button>
<button class="small-btn delete" onclick="deleteRecord('${r.id}')">Supprimer</button>
</td>
</tr>

`).join("") || "<tr><td colspan='8'>Aucun enregistrement</td></tr>";

}

$("search").addEventListener("click",renderHistory);

// =====================================
// EDIT RECORD
// =====================================

window.editRecord = function(id){

const r = records.find(x=>x.id === id);

if(!r) return;

$("date").value = r.date;

$("center").value = r.center;

$("a").value = r.answered;

$("m").value = r.missed;

$("t").value = r.transferred;

$("notes").value = r.notes || "";

records = records.filter(x=>x.id !== id);

saveData();

document.querySelector('[data-page="entry"]').click();

$("message").textContent = "Modifiez les informations puis enregistrez.";

};

// =====================================
// DELETE RECORD
// =====================================

window.deleteRecord = function(id){

if(confirm("Voulez-vous supprimer cet enregistrement ?")){

records = records.filter(r=>r.id !== id);

saveData();

renderHistory();

renderDashboard();

}

};

// =====================================
// DOWNLOAD BACKUP
// =====================================

function download(filename,content,type){

const blob = new Blob([content],{type});

const url = URL.createObjectURL(blob);

const a = document.createElement("a");

a.href = url;

a.download = filename;

a.click();

URL.revokeObjectURL(url);

}

// =====================================
// BACKUP
// =====================================

$("backup").addEventListener("click",()=>{

download(

"Call_Center_Backup.json",

JSON.stringify({version:1,records},null,2),

"application/json"

);

});

// =====================================
// RESTORE
// =====================================

$("restore").addEventListener("click",async()=>{

const file = $("file").files[0];

if(!file){

alert("Veuillez sélectionner un fichier.");

return;

}

try{

const data = JSON.parse(await file.text());

const imported = Array.isArray(data) ? data : data.records;

if(!Array.isArray(imported)) throw new Error();

let count = 0;

imported.forEach(r=>{

if(!CENTERS.includes(r.center)) return;

if(!r.date) return;

const answered = numberValue(r.answered);

const missed = numberValue(r.missed);

const transferred = numberValue(r.transferred);

if(answered === null || missed === null || transferred === null || transferred > answered) return;

const index = records.findIndex(x=>

x.date === r.date &&
x.center === r.center

);

const clean = {

id:r.id || String(Date.now()+Math.random()),

date:r.date,

center:r.center,

answered,

missed,

transferred,

notes:String(r.notes || "")

};

if(index >= 0){

records[index] = clean;

}else{

records.push(clean);

count++;

}

});

saveData();

renderDashboard();

renderHistory();

alert("Importation terminée. Nouveaux enregistrements : "+count);

}catch{

alert("Fichier de sauvegarde invalide.");

}

});

// =====================================
// INITIALIZATION
// =====================================

initializeCenters();

$("date").value = today;

$("reportDate").value = today;

renderDashboard();

renderHistory();
