const STARTING_CASH = 100000;

const stocks = [
  { symbol: "RELIANCE",    name: "Reliance Industries",      price: 2900,     change: 1.2  },
  { symbol: "TCS",         name: "Tata Consultancy",         price: 4100,     change: -0.6 },
  { symbol: "INFY",        name: "Infosys",                  price: 1850,     change: 0.4  },
  { symbol: "HDFCBNK",     name: "HDFC Bank",                price: 1650,     change: -1.1 },
  { symbol: "ITC",         name: "ITC Limited",              price: 470,      change: 2.3  },
  { symbol: "SBI",         name: "State Bank of India",      price: 2470,     change: 9.3  },
  { symbol: "MRF",         name: "MRF tyres limited",        price: 4470,     change: -6.3 },
  { symbol: "TSL",         name: "Tata steel limited",       price: 5340,     change: 10.3 },
  { symbol: "JIO",         name: "Relaince JIO internet",    price: 2125,     change: -3.3 },
  { symbol: "CANRBNK",     name: "Canara government bank",   price: 2375,     change: 5.3  },
];

stocks.forEach(function (stock) {
  stock.open = stock.price / (1 + (stock.change || 0) / 100);
});

let wallet = STARTING_CASH;
let holdings = {};   
let history = [];

function saveData() {
  const data = { wallet : wallet, holdings: holdings, history: history };
  localStorage.setItem("paperTrading", JSON.stringify(data));
}

function loadData() {
  const saved = localStorage.getItem("paperTrading");
  
  if (!saved) {
    return;
  }
  
  try {
    const data = JSON.parse(saved);
    wallet = data.wallet;
    holdings = data.holdings;
    history = data.history;
  }
  
  catch (error) {
    console.log("Could not load saved data", error);
  }
}

function resetAccount() {
  if (!confirm("Reset your account to ₹100000 cash and clear all trades?")) {
    return;
  }
  
  wallet = STARTING_CASH;
  holdings = {};
  history = [];
  saveData();
  drawAll();
  
  showMessage("Account reset." , "ok");
}

function formatMoney(number) {

  return number.toLocaleString("en-IN", {

    minimumFractionDigits: 2,
    maximumFractionDigits: 2,

  });
}

function round2(number) {
  return Math.round(number * 100) / 100;
}

function formatSigned(number) {
  const sign = number >= 0 ? "+" : "-";
  return sign + "₹" + formatMoney(Math.abs(number));
}

function formatChange(change) {
  const arrow = change >= 0 ? "▲" : "▼";
  return arrow + " " + Math.abs(change).toFixed(2) + "%";
}

function changeClass(change) {
  return change >= 0 ? "up" : "down";
}

function getStock(symbol) {
  return stocks.find(function (s) {
  return s.symbol === symbol;
  });
}

function holdingsValue() {
  let total = 0;
  Object.keys(holdings).forEach(function (symbol) {
    total = total + holdings[symbol].qty * getStock(symbol).price;
  });

  return total;
}

let messageTimer;

function showMessage(text, type) {
  const box = document.getElementById("message");
  box.textContent = text;
  box.className = type;

  clearTimeout(messageTimer);
  messageTimer = setTimeout(function () {
    box.textContent = "";
  }, 3500);
}


function drawWallet() {
  document.getElementById("wallet").textContent = formatMoney(wallet);
}

function drawTicker() {
  const strip = document.getElementById("ticker");
  strip.innerHTML = "";

  stocks.forEach(function (stock) {
    strip.innerHTML += `

    <span>
        <span class="sym">${stock.symbol}</span>
        ₹${formatMoney(stock.price)}
        <span class="${changeClass(stock.change)}">${formatChange(stock.change)}</span>
    </span>

      `;
  });
}

function drawStocks() {
  const list = document.getElementById("stock-list");

  list.innerHTML = `
    <div class="row head">
      <div>Stock</div><div>Price</div><div>Today</div><div>Trade</div>
    </div>
  `;

  stocks.forEach(function (stock) {
    list.innerHTML += `
      <div class="row">
      <div>
          <div class="symbol">${stock.symbol}</div>
          <div class="full-name">${stock.name}</div>
        </div>

        <div class="price" id="price-${stock.symbol}"></div>
        <div class="change" id="change-${stock.symbol}"></div>
        <div class="actions">

        <input type="number" id="qty-${stock.symbol}" value="1" min="1" aria-label="Quantity of ${stock.symbol}">
          <button class="buy" onclick="buyStock('${stock.symbol}')">Buy</button>
          <button class="sell" onclick="sellStock('${stock.symbol}')">Sell</button>
        </div>
      </div>
    `;
  });

  updatePrices();
}

function updatePrices() {

  stocks.forEach(function (stock) {

    document.getElementById("price-" + stock.symbol).textContent = "₹" + formatMoney(stock.price);

    const changeBox = document.getElementById("change-" + stock.symbol);
    
    changeBox.textContent = formatChange(stock.change);
    
    changeBox.className = "change " + changeClass(stock.change);
  });
}


function drawHoldings() {
  const list = document.getElementById("holdings-list");
  list.innerHTML = "";

  const symbols = Object.keys(holdings);

  if (symbols.length === 0) {
    list.innerHTML = '<p class="empty">No shares yet. Buy one from the market list.</p>';
    return;
  }

  symbols.forEach(function (symbol) {

    const qty = holdings[symbol].qty;
    const avg = holdings[symbol].avgPrice;
    const price = getStock(symbol).price;
    const value = qty * price;
    const profit = (price - avg) * qty;
    const percent = ((price - avg) / avg) * 100;

    list.innerHTML += `
      <div class="row holding">

      <div>
          <div class="symbol">${symbol}</div>
          <div class="full-name">${qty} shares @ ₹${formatMoney(avg)}</div>
        </div>

        <div class="price">₹${formatMoney(value)}</div>
        <div class="change ${changeClass(profit)}">
          ${formatSigned(profit)}<br>${percent.toFixed(2)}%

          </div>
      </div>
    `;
  });
}

function drawSummary() {
  const inShares = holdingsValue();
  const total = wallet + inShares;
  const profit = total - STARTING_CASH;
  const percent = (profit / STARTING_CASH) * 100;

  document.getElementById("summary").innerHTML = `
    <div class="stat">

    <span class="label">Portfolio value</span>
    <span class="value">₹${formatMoney(total)}</span>
    </div>

    <div class="stat">
      <span class="label">Invested in shares</span>
      <span class="value">₹${formatMoney(inShares)}</span>
    </div>

    <div class="stat">
      <span class="label">Total profit / loss</span>
      <span class="value ${changeClass(profit)}">${formatSigned(profit)} (${percent.toFixed(2)}%)</span>
    </div>

    <button class="reset" onclick="resetAccount()">Reset</button>
  `;
}

function drawHistory() {
  const list = document.getElementById("history-list");
  list.innerHTML = "";

  if (history.length === 0) {
    list.innerHTML = '<p class="empty">No trades yet.</p>';
    return;
  }

  history.slice(0, 8).forEach(function (trade) {
    const when = new Date(trade.time).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    list.innerHTML += `
      <div class="row trade">
        <span class="tag ${trade.type}">${trade.type.toUpperCase()}</span>
        <div>

        ${trade.qty} ${trade.symbol} @ ₹${formatMoney(trade.price)}

        <div class="full-name">${when}</div>
        </div>

        <div class="price">₹${formatMoney(trade.qty * trade.price)}</div>
      </div>
    `;
  });
}

function drawAll() {
  drawWallet();
  drawTicker();
  drawSummary();
  drawStocks();
  drawHoldings();
  drawHistory();
}


function getQuantity(symbol) {
  const value = Number(document.getElementById("qty-" + symbol).value);
  return Math.floor(value);
}


function buyStock(symbol) {

  const qty = getQuantity(symbol);
  const price = getStock(symbol).price;
  const cost = round2(qty * price);
 
  if (qty < 1) {
    showMessage("Enter at least 1 share.", "error");
    return;
  }

  if (cost > wallet) {
    showMessage("Not enough cash. You need ₹" + formatMoney(cost) + ".", "error");
    return;
  }
 
  const oldQty = holdings[symbol] ? holdings[symbol].qty : 0;
  const oldAvg = holdings[symbol] ? holdings[symbol].avgPrice : 0;
  const newQty = oldQty + qty;
  const newAvg = (oldQty * oldAvg + qty * price) / newQty;
 
  wallet = round2(wallet - cost);
  holdings[symbol] = { qty: newQty, avgPrice: newAvg };
  recordTrade("buy", symbol, qty, price);
  saveData();
  drawAll();
  showMessage("Bought " + qty + " " + symbol + " for ₹" + formatMoney(cost), "ok");
}

function recordTrade(type, symbol, qty, price) {
  history.unshift({
    type: type,
    symbol: symbol,
    qty: qty,
    price: price,
    time: new Date().toISOString(),
  });

  if (history.length > 100) {
    history.pop();
  }
}

function sellStock(symbol) {
  const qty = getQuantity(symbol);
  const price = getStock(symbol).price;
  const owned = holdings[symbol] ? holdings[symbol].qty : 0;
 
  if (qty < 1) {
    showMessage("Enter at least 1 share.", "error");
    return;
  }
  
  if (qty > owned) {
    showMessage("You only own " + owned + " " + symbol + ".", "error");
    return;
  }
 
  const earned = round2(qty * price);
  
  wallet = round2(wallet + earned);
  holdings[symbol].qty = owned - qty;
 
  if (holdings[symbol].qty === 0) {
  
    delete holdings[symbol];
  }
 
  recordTrade("sell", symbol, qty, price);
  saveData();
  drawAll();

  showMessage("Sold " + qty + " " + symbol + " for ₹" + formatMoney(earned), "ok");
}
 
 function movePrices() {
  stocks.forEach(function (stock) {

    const move = (Math.random() - 0.5) * 0.01;
    stock.price = Math.max(1, round2(stock.price * (1 + move)));
    stock.change = ((stock.price - stock.open) / stock.open) * 100;
  });
 
  updatePrices();
  drawTicker();
  drawHoldings();
  drawSummary();
}
 
 
loadData();
drawAll();
setInterval(movePrices, 4000);
 