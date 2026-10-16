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

let wallet = 100000;
let holdings = {};   

function formatMoney(number) {
  return number.toLocaleString("en-IN");
}

function getStock(symbol) {
  return stocks.find(function (s) {
    return s.symbol === symbol;
  });
}

function formatChange(change) {
  const arrow = change >= 0 ? "▲" : "▼";
  return arrow + " " + Math.abs(change).toFixed(2) + "%";
}

function changeClass(change) {
  return change >= 0 ? "up" : "down";
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
        <div class="price">₹${formatMoney(stock.price)}</div>
        <div class="change ${changeClass(stock.change)}">${formatChange(stock.change)}</div>
        <div class="actions">
          <input type="number" id="qty-${stock.symbol}" value="1" min="1" aria-label="Quantity of ${stock.symbol}">
          <button class="buy" onclick="buyStock('${stock.symbol}')">Buy</button>
          <button class="sell" onclick="sellStock('${stock.symbol}')">Sell</button>
        </div>
      </div>
    `;
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
    const qty = holdings[symbol];
    const price = getStock(symbol).price;
    list.innerHTML += `
      <div class="row holding">
        <div class="symbol">${symbol}</div>
        <div>${qty} shares</div>
        <div class="price">₹${formatMoney(qty * price)}</div>
      </div>
    `;
  });
}

function drawAll() {
  drawWallet();
  drawTicker();
  drawStocks();
  drawHoldings();
}


function getQuantity(symbol) {
  const value = Number(document.getElementById("qty-" + symbol).value);
  return Math.floor(value);
}

function buyStock(symbol) {
  const qty = getQuantity(symbol);
  const price = getStock(symbol).price;
  const cost = qty * price;

  if (qty < 1) {
    showMessage("Enter at least 1 share.", "error");
    return;
  }
  if (cost > wallet) {
    showMessage("Not enough cash. You need ₹" + formatMoney(cost) + ".", "error");
    return;
  }

  wallet = wallet - cost;
  holdings[symbol] = (holdings[symbol] || 0) + qty;

  drawAll();
  showMessage("Bought " + qty + " " + symbol + " for ₹" + formatMoney(cost), "ok");
}

function sellStock(symbol) {
  const qty = getQuantity(symbol);
  const price = getStock(symbol).price;
  const owned = holdings[symbol] || 0;

  if (qty < 1) {
    showMessage("Enter at least 1 share.", "error");
    return;
  }
  if (qty > owned) {
    showMessage("You only own " + owned + " " + symbol + ".", "error");
    return;
  }

  wallet = wallet + qty * price;
  holdings[symbol] = owned - qty;

  if (holdings[symbol] === 0) {
    delete holdings[symbol];
  }

  drawAll();
  showMessage("Sold " + qty + " " + symbol + " for ₹" + formatMoney(qty * price), "ok");
}

drawAll();