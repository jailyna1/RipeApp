const produceKeywords = [
    "apple", "apples", "banana", "bananas", "tomato", "tomatoes",
    "grape", "grapes", "orange", "oranges", "pear", "pears",
    "strawberry", "strawberries", "peach", "peaches", "lettuce",
    "spinach", "carrot", "carrots", "broccoli", "avocado",
    "blueberry", "blueberries", "raspberry", "raspberries",

    // Additional Fruits
    "pineapple", "pineapples", "mango", "mangoes", "watermelon", "watermelons",
    "cantaloupe", "cantaloupes", "honeydew", "honeydews", "kiwi", "kiwis",
    "pomegranate", "pomegranates", "plum", "plums", "cherry", "cherries",
    "fig", "figs", "coconut", "coconuts", "persimmon", "persimmons",
    "apricot", "apricots", "nectarine", "nectarines", "lime", "limes",
    "lemon", "lemons", "grapefruit", "grapefruits", "guava", "guavas",
    "papaya", "papayas", "dragonfruit", "dragonfruits", "passionfruit", "passionfruits",
    "lychee", "lychees", "starfruit", "starfruits", "blackberry", "blackberries",
    "cranberry", "cranberries", "mulberry", "mulberries",

    // Additional Vegetables
    "cucumber", "cucumbers", "zucchini", "zucchinis", "squash", "squashes",
    "pumpkin", "pumpkins", "celery", "celeries", "kale", "cabbage",
    "brussels sprout", "brussels sprouts", "cauliflower", "radish", "radishes",
    "beet", "beets", "asparagus", "artichoke", "artichokes", "eggplant",
    "mushroom", "mushrooms", "onion", "onions", "shallot", "shallots",
    "leek", "leeks", "garlic", "bell pepper", "bell peppers", "pepper", "peppers",
    "jalapeno", "jalapenos", "habanero", "habaneros", "serrano", "serranos",
    "chili", "chilis", "scallion", "scallions", "turnip", "turnips",
    "parsnip", "parsnips", "rhubarb", "rhubarbs", "sweet corn", "pea", "peas",
    
    // Leafy Greens & Herbs
    "arugula", "basil", "cilantro", "parsley", "rosemary", "thyme",
    "mint", "dill", "chive", "chives", "oregano", "sage",
    "watercress", "endive", "bok choy", "swiss chard", "mustard greens", "romaine", "iceberg",

    // Root Vegetables
    "potato", "potatoes", "yam", "yams", "sweet potato", "sweet potatoes",
    "ginger", "turmeric", "daikon", "horseradish", "taro", "jicama",

    // Miscellaneous
    "okra", "edamame", "snap pea", "snap peas", "snow pea", "snow peas",
    "green bean", "green beans", "lentil", "lentils", "chickpea", "chickpeas",
    "soybean", "soybeans", "peanut", "peanuts", "walnut", "walnuts",
    "almond", "almonds", "cashew", "cashews", "pecan", "pecans",
    "pistachio", "pistachios", "hazelnut", "hazelnuts", "macadamia", "macadamias", "egg", "eggs"
];


function isProduceItem(description) {
    return produceKeywords.some(keyword => description.toLowerCase().includes(keyword));
}

// Screens
const uploadScreen = document.getElementById("uploadScreen");
const processingScreen = document.getElementById("processingScreen");
const receiptDetailsScreen = document.getElementById("receiptDetailsScreen");

// Elements
const receiptInput = document.getElementById("receiptInput");
const uploadBtn = document.getElementById("uploadBtn");
const storeName = document.getElementById("storeName");
const receiptDate = document.getElementById("receiptDate");
const produceList = document.getElementById("produceList");

let selectedFile = null;

// Click button to trigger file input
uploadBtn.addEventListener("click", () => {
    receiptInput.click();
});

// Detect file selection
receiptInput.addEventListener("change", () => {
    if (receiptInput.files.length > 0) {
        selectedFile = receiptInput.files[0];
        processReceipt();
    }
});

// Function to process receipt with loading state
async function processReceipt() {
    if (!selectedFile) return;

    // Switch to Processing Screen
    uploadScreen.classList.add("hidden");
    processingScreen.classList.remove("hidden");

    const formData = new FormData();
    formData.append("receipt", selectedFile);

    try {
        const res = await fetch("/api/scan-receipt", {
            method: "POST",
            body: formData
        });

        if (!res.ok) throw new Error(`Server error: ${res.statusText}`);
        const data = await res.json();

        // Check for a valid date
        if (!data.date || data.date.trim() === "") {
            throw new Error("No date found. Please retake the photo.");
        }

        storeName.textContent = data.vendor || "Unknown Store";
        receiptDate.textContent = data.date;

        const lineItems = data.line_items || [];
        const produceItems = lineItems.filter(item => isProduceItem(item.description));

        produceList.innerHTML = "";
        if (produceItems.length === 0) {
            produceList.innerHTML = "<p>No produce found.</p>";
        } else {
            produceItems.forEach(item => {
                const li = document.createElement("li");
                li.innerHTML = `
                    ${item.description} (Qty: ${item.quantity || 1})
                    <label class="upload-image">📷 Upload
                        <input type="file" accept="image/*" class="hidden">
                    </label>
                `;
                produceList.appendChild(li);
            });
        }

        // Switch to Receipt Details Screen
        processingScreen.classList.add("hidden");
        receiptDetailsScreen.classList.remove("hidden");

    } catch (err) {
        console.error(err);
        alert(err.message || "Error processing receipt. Please try again.");

        // Reset UI & go back to upload screen
        processingScreen.classList.add("hidden");
        uploadScreen.classList.remove("hidden");
        selectedFile = null;
        receiptInput.value = ""; // Clear file input
    }
}
