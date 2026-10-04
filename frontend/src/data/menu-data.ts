
export type MenuCategory =
  | "Starters"
  | "Mains"
  | "Desserts"
  | "Beverages"
  | "Sides";

export type MenuItem = {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  vegetarian: boolean;
  description?: string;
};

type MenuSeed = [string, MenuCategory, number, boolean, string?];

const menus: Record<string, MenuSeed[]> = {
  "1": [
    ["Burrata & Heirloom Tomato", "Starters", 590, true],
    ["Truffle Mushroom Crostini", "Starters", 420, true],
    ["Mediterranean Mezze Platter", "Starters", 520, true],
    ["Lemon Herb Prawns", "Starters", 650, false],
    ["Roasted Pumpkin Soup", "Starters", 340, true],
    ["Wild Mushroom Risotto", "Mains", 720, true],
    ["Penne Arrabbiata", "Mains", 590, true],
    ["Grilled Chicken Piccata", "Mains", 790, false],
    ["Mediterranean Grain Bowl", "Mains", 620, true],
    ["Herb Crusted Sea Bass", "Mains", 980, false],
    ["Classic Tiramisu", "Desserts", 390, true],
    ["Lemon Olive Oil Cake", "Desserts", 360, true],
    ["Espresso Panna Cotta", "Desserts", 340, true],
    ["Fresh Mint Lemonade", "Beverages", 220, true],
    ["Mediterranean Iced Tea", "Beverages", 190, true],
  ],

  "2": [
    ["Paneer Tikka", "Starters", 320, true],
    ["Crispy Corn Chaat", "Starters", 240, true],
    ["Chicken Malai Kebab", "Starters", 390, false],
    ["Hara Bhara Kebab", "Starters", 280, true],
    ["Tandoori Prawns", "Starters", 520, false],
    ["Butter Paneer Masala", "Mains", 390, true],
    ["Hyderabadi Chicken Biryani", "Mains", 450, false],
    ["Dal Makhani", "Mains", 320, true],
    ["Mutton Rogan Josh", "Mains", 560, false],
    ["Vegetable Dum Biryani", "Mains", 360, true],
    ["Gulab Jamun", "Desserts", 160, true],
    ["Matka Kulfi", "Desserts", 190, true],
    ["Rasmalai", "Desserts", 180, true],
    ["Masala Chai", "Beverages", 100, true],
    ["Mango Lassi", "Beverages", 160, true],
  ],

  "3": [
    ["Edamame with Sea Salt", "Starters", 320, true],
    ["Vegetable Gyoza", "Starters", 390, true],
    ["Chicken Karaage", "Starters", 450, false],
    ["Salmon Tataki", "Starters", 620, false],
    ["Miso Soup", "Starters", 220, true],
    ["Salmon Nigiri Set", "Mains", 790, false],
    ["Avocado Maki Roll", "Mains", 490, true],
    ["Chicken Teriyaki Don", "Mains", 620, false],
    ["Vegetable Ramen", "Mains", 560, true],
    ["Prawn Tempura Udon", "Mains", 690, false],
    ["Matcha Cheesecake", "Desserts", 390, true],
    ["Mochi Ice Cream", "Desserts", 320, true],
    ["Black Sesame Pudding", "Desserts", 340, true],
    ["Iced Matcha Latte", "Beverages", 290, true],
    ["Yuzu Cooler", "Beverages", 260, true],
  ],

  "4": [
    ["Bruschetta al Pomodoro", "Starters", 290, true],
    ["Garlic Bread with Herbs", "Starters", 240, true],
    ["Caprese Salad", "Starters", 390, true],
    ["Chicken Meatballs", "Starters", 420, false],
    ["Creamy Tomato Soup", "Starters", 260, true],
    ["Margherita Wood-Fired Pizza", "Mains", 490, true],
    ["Pesto Penne", "Mains", 520, true],
    ["Four Cheese Ravioli", "Mains", 690, true],
    ["Chicken Alfredo", "Mains", 640, false],
    ["Mushroom Truffle Pizza", "Mains", 720, true],
    ["Classic Panna Cotta", "Desserts", 320, true],
    ["Chocolate Lava Cake", "Desserts", 350, true],
    ["Cannoli Siciliani", "Desserts", 340, true],
    ["Italian Soda", "Beverages", 180, true],
    ["Iced Mocha", "Beverages", 240, true],
  ],

  "5": [
    ["Loaded Nachos", "Starters", 360, true],
    ["Peri Peri Chicken Wings", "Starters", 420, false],
    ["Cheese Jalapeño Poppers", "Starters", 320, true],
    ["Smoked Corn Ribs", "Starters", 290, true],
    ["Crispy Calamari", "Starters", 490, false],
    ["Grilled Cottage Cheese Steak", "Mains", 560, true],
    ["Classic Beefless Burger", "Mains", 490, true],
    ["Grilled Chicken Breast", "Mains", 650, false],
    ["BBQ Paneer Bowl", "Mains", 520, true],
    ["Herb Roasted Fish", "Mains", 760, false],
    ["Warm Brownie & Ice Cream", "Desserts", 360, true],
    ["New York Cheesecake", "Desserts", 390, true],
    ["Caramel Custard", "Desserts", 290, true],
    ["Watermelon Cooler", "Beverages", 220, true],
    ["Cold Brew Coffee", "Beverages", 240, true],
  ],

  "6": [
    ["Masala Vada", "Starters", 100, true],
    ["Crispy Onion Pakoda", "Starters", 120, true],
    ["Paneer Puff", "Starters", 110, true],
    ["Mini Samosa Plate", "Starters", 130, true],
    ["Chilli Chicken Bites", "Starters", 220, false],
    ["Masala Dosa", "Mains", 180, true],
    ["Paneer Kathi Roll", "Mains", 220, true],
    ["Veg Pulao & Raita", "Mains", 240, true],
    ["Chicken Kathi Roll", "Mains", 260, false],
    ["Chole Kulcha", "Mains", 210, true],
    ["Gajar Ka Halwa", "Desserts", 140, true],
    ["Hot Chocolate Brownie", "Desserts", 190, true],
    ["Filter Coffee Ice Cream", "Desserts", 180, true],
    ["South Indian Filter Coffee", "Beverages", 90, true],
    ["Ginger Cardamom Chai", "Beverages", 80, true],
  ],

  "7": [
    // Classic soups
    ["Manchow, Vegetable Cigar", "Starters", 345, true, "Peppery Indo-Chinese vegetable soup with a crisp vegetable cigar."],
    ["Sweet Corn, Bhutta Kees Crostini", "Starters", 345, true, "Creamy sweet corn soup with bhutta kees crostini."],
    ["Tomato Basil, Focaccia", "Starters", 345, true, "Velvety tomato soup with fresh basil and warm focaccia."],
    ["Mushroom Cappuccino, Khari", "Starters", 345, true, "Roasted mushroom cream, pepper foam and buttery khari."],

    // Salads & chaats
    ["Watermelon Feta Salad", "Starters", 395, true, "Chilled watermelon topped with feta, pomegranate seeds, and basil dust."],
    ["Caesar Salad", "Starters", 395, true, "Crisp lettuce, parmesan, and classic Caesar dressing."],
    ["Raw Mango, Papaya & Bean Sprout Salad", "Starters", 375, true, "Shredded raw mango, papaya, and sprouts tossed in a tangy dressing."],
    ["Fig & Burrata Salad", "Starters", 425, true, "Creamy burrata with figs, arugula, sun-dried tomato, and seed crunch."],
    ["Dhokla Chaat", "Starters", 365, true, "Soft dhokla layered with chutneys, yogurt, sev, and fresh herbs."],
    ["Samosa Mille-Feuille Chaat", "Starters", 395, true, "Layered samosa pastry with pindi chole."],
    ["Beetroot Tikki Chaat", "Starters", 385, true, "Beetroot patties layered with yogurt, tamarind caviar, and sev."],
    ["Palak Patta Aur Aam Panna Chaat", "Starters", 375, true, "Crisp spinach leaves topped with aam panna gel, yogurt espuma, and boondi."],

    // Continental starters
    ["Lotus Chips", "Starters", 345, true, "Crispy lotus stem chips lightly seasoned with chimichurri dust."],
    ["French Fries - Salted", "Starters", 325, true, "Classic salted French fries."],
    ["French Fries - Peri Peri", "Starters", 325, true, "French fries seasoned with peri peri."],
    ["French Fries - Cheesy Overload", "Starters", 375, true, "French fries topped with cheesy overload."],
    ["Mushroom Ricotta Croquettes", "Starters", 395, true, "Golden croquettes filled with a creamy mushroom and ricotta mixture."],
    ["Mexican-Style Nachos", "Starters", 375, true, "Crispy tortilla chips loaded with beans, cheese, salsa, jalapeños, and sour cream."],
    ["Crumb-Fried Onion Rings", "Starters", 335, true, "Crunchy onion rings fried golden and served with cheese sauce."],
    ["Pesto Kunafa Tofu", "Starters", 445, true, "Crisp kunafa tofu bites with pesto."],
    ["Spinach Ricotta Tart", "Starters", 395, true, "Mini tart filled with spinach and ricotta."],
    ["Trio Hummus with Pita & Falafel", "Starters", 455, true, "Chickpea, beetroot, and edamame hummus served with pita and falafel."],

    // Tandoor & South Indian starters
    ["Tandoori Soya Chaap", "Starters", 415, true, "Soya chaap marinated in spiced yogurt, stuffed, and chargrilled till smoky."],
    ["Bharwan Mushroom", "Starters", 415, true, "Mushrooms stuffed with cheese and herbs, then roasted in tandoor."],
    ["Tandoori Pineapple", "Starters", 385, true, "Pineapple chunks grilled in a spiced marinade with gentle smokiness."],
    ["Malai Broccoli", "Starters", 425, true, "Broccoli florets coated in creamy malai marinade and roasted."],
    ["Achari Paneer", "Starters", 425, true, "Cottage cheese marinated in achari spices, chargrilled, and mustard-finished."],
    ["Hara Bhara Kebab", "Starters", 395, true, "Classic green kebabs with a crisp crust and soft centre."],
    ["Pepper Dry - Mushroom", "Starters", 395, true, "Wok-tossed with black pepper, curry leaves, onion, and green chilli."],
    ["Pepper Dry - Baby Corn", "Starters", 395, true, "Wok-tossed with black pepper, curry leaves, onion, and green chilli."],
    ["Pepper Dry - Paneer", "Starters", 475, true, "Wok-tossed with black pepper, curry leaves, onion, and green chilli."],
    ["Ghee Roast - Mushroom", "Starters", 425, true, "Kundapura-style spicy ghee roast masala and bold flavours."],
    ["Ghee Roast - Paneer", "Starters", 495, true, "Kundapura-style spicy ghee roast masala and bold flavours."],
    ["Andhra-Style Chilli Paneer", "Starters", 455, true, "Paneer cubes stir-fried with green chillies and curry leaves."],
    ["Curry Leaf Chilli Tofu", "Starters", 455, true, "Tofu wok-tossed with curry leaves, mustard, and fresh chillies."],
    ["Paneer 65", "Starters", 465, true, "Deep-fried paneer tossed with red chilli, curry leaves, and yogurt."],

    // Pan Asian starters
    ["Coriander Chilli Water Chestnut", "Starters", 415, true, "Crunchy water chestnuts tossed with coriander, chilli, and Asian seasonings."],
    ["Chilli Crispy Corn Kernels", "Starters", 375, true, "Golden fried corn kernels tossed in chilli and herbs."],
    ["Shanghai Vegetable Roll", "Starters", 375, true, "Crisp rolls stuffed with seasoned vegetables and fried till golden."],
    ["Cauliflower Manchurian", "Starters", 345, true, "Crispy cauliflower tossed in a tangy, spicy Manchurian sauce."],
    ["Wok Tossed Chilli - Baby Corn", "Starters", 375, true, "Choice of protein tossed with bell peppers, soy, and garlic chilli sauce."],
    ["Wok Tossed Chilli - Mushroom", "Starters", 375, true, "Choice of protein tossed with bell peppers, soy, and garlic chilli sauce."],
    ["Wok Tossed Chilli - Paneer", "Starters", 495, true, "Choice of protein tossed with bell peppers, soy, and garlic chilli sauce."],
    ["Tai Pei Paneer", "Starters", 495, true, "Wok-tossed paneer in spicy Tai Pei-style chilli garlic sauce."],
    ["Sprout & Tofu Chilli", "Starters", 455, true, "Bean sprouts and tofu finished with garlic, chilli crisp, and soy glaze."],
    ["Paneer Lollipop", "Starters", 455, true, "Crunchy paneer skewers served with Thai sweet chilli sauce."],

    // Sliders
    ["Jackfruit BBQ Slider", "Starters", 395, true, "Pulled jackfruit in BBQ sauce tucked inside a soft slider bun."],
    ["Falafel Slider", "Starters", 395, true, "Falafel patty with tahini yogurt, lettuce, and pickled vegetables."],
    ["Paneer Tikka Slider", "Starters", 445, true, "Mini burger with smoky paneer tikka patty and mint mayo."],

    // Signature parota quesadillas
    ["Chettinad Paneer Quesadilla", "Starters", 465, true, "Spiced paneer, melted cheese, onions, and bold Chettinad flavours."],
    ["Corn Saag Quesadilla", "Starters", 445, true, "Creamy saag, sweet corn, cheese, and gentle spice balance."],
    ["Mushroom Ghee Roast Quesadilla", "Starters", 445, true, "Spicy ghee roast mushrooms, melted cheese, and onion crunch."],

    // Pasta
    ["Alfredo - Spaghetti", "Mains", 465, true, "Rich parmesan cream sauce with butter."],
    ["Alfredo - Penne", "Mains", 465, true, "Rich parmesan cream sauce with butter."],
    ["Fiery Arrabbiata - Spaghetti", "Mains", 465, true, "Spicy San Marzano tomato sauce with garlic and red chilli flakes."],
    ["Fiery Arrabbiata - Penne", "Mains", 465, true, "Spicy San Marzano tomato sauce with garlic and red chilli flakes."],
    ["Pesto Cream - Spaghetti", "Mains", 465, true, "Basil pesto blended with cream, parmesan, and olive oil."],
    ["Pesto Cream - Penne", "Mains", 465, true, "Basil pesto blended with cream, parmesan, and olive oil."],
    ["Aglio e Olio - Spaghetti", "Mains", 465, true, "Garlic- and chilli-infused olive oil finished with parsley."],
    ["Aglio e Olio - Penne", "Mains", 465, true, "Garlic- and chilli-infused olive oil finished with parsley."],
    ["Mac & Cheese", "Mains", 465, true, "Baked macaroni in cheddar cheese sauce, topped with parmesan."],
    ["Mushroom Ricotta Ravioli in Creamy Pesto Sauce", "Mains", 525, true, "Handmade ravioli stuffed with mushroom ricotta, served in basil pesto cream."],

    // Steaks
    ["Grilled Paneer Steak", "Mains", 525, true, "Pesto-rubbed paneer, served with grilled vegetables, mashed potato or herb rice."],
    ["Chettinad Tofu Steak", "Mains", 525, true, "Tofu with Chettinad spice, served with grilled vegetables, mashed potato or herb rice."],

    // Pan Asian mains
    ["Thai Curry - Green", "Mains", 425, true, "Fragrant coconut curry with lemongrass, galangal, kaffir lime, and vegetables."],
    ["Thai Curry - Red", "Mains", 425, true, "Fragrant coconut curry with lemongrass, galangal, kaffir lime, and vegetables."],
    ["Mapo Tofu", "Mains", 425, true, "Silken tofu simmered in spicy bean paste and chilli oil."],
    ["Kung Pao - Mushroom", "Mains", 425, true, "Stir-fried with chillies, garlic, and roasted peanuts in sweet-spicy sauce."],
    ["Kung Pao - Paneer", "Mains", 475, true, "Stir-fried with chillies, garlic, and roasted peanuts in sweet-spicy sauce."],
    ["Cantonese Gravy - Vegetables", "Mains", 420, true, "Light soy-garlic gravy with seasonal vegetables."],
    ["Cantonese Gravy - Paneer", "Mains", 475, true, "Light soy-garlic gravy with paneer."],
    ["Tofu Katsu Curry", "Mains", 475, true, "Crispy panko-crusted tofu cutlets served with velvety Japanese curry."],
    ["Massaman Paneer Curry", "Mains", 475, true, "Paneer cooked in Thai-style Massaman curry with warm spices."],

    // Indian mains
    ["Dal Makhani", "Mains", 395, true, "Slow-cooked black lentils simmered overnight with butter and cream."],
    ["Paneer Butter Masala", "Mains", 465, true, "Cottage cheese cubes in a buttery tomato cream sauce."],
    ["Dahi Bhindi", "Mains", 395, true, "Tender bhindi simmered in spiced yogurt gravy with gentle tang."],
    ["Mushroom Matar Methi Malai", "Mains", 415, true, "Mushrooms and green peas cooked in creamy fenugreek malai gravy."],
    ["Stuffed Paneer Palak", "Mains", 475, true, "Spinach purée with stuffed paneer pockets and garlic tempering."],
    ["Kofta Noorani", "Mains", 475, true, "Vegetable kofta balls served in a rich cashew-onion gravy."],
    ["Kadhai Paneer", "Mains", 475, true, "Cottage cheese tossed with capsicum, onions, and kadhai masala."],
    ["Kadhai Veg", "Mains", 395, true, "Seasonal vegetables stir-cooked with capsicum, onions, and signature kadhai masala."],
    ["Alleppey Mango Curry - Vegetables", "Mains", 415, true, "Kerala-style mango curry with coconut, gentle spices, and a tangy finish."],
    ["Alleppey Mango Curry - Tofu", "Mains", 445, true, "Kerala-style mango curry with coconut, gentle spices, and a tangy finish."],
    ["Paneer Chettinad", "Mains", 475, true, "Paneer simmered in roasted Chettinad masala with coconut and pepper."],
    ["Gongura Paneer Koora", "Mains", 475, true, "Paneer cubes cooked with tangy gongura, garlic, and chillies."],

    // Pan Asian rice & noodles
    ["Steamed Jasmine Rice", "Mains", 310, true, "Soft, fragrant jasmine rice served light and perfectly steamed."],
    ["Blue Pea & Edamame Fried Rice", "Mains", 425, true, "Blue rice wok-tossed with fresh edamame and soy."],
    ["Classic Fried Rice", "Mains", 385, true, "Wok-tossed rice with garden vegetables, soy, and spring onion."],
    ["Kimchi Fried Rice", "Mains", 385, true, "Korean-style fried rice with spicy kimchi, sesame, and scallions."],
    ["Sichuan Fried Rice", "Mains", 385, true, "Chilli-garlic fried rice with vegetables and Sichuan peppercorn heat."],
    ["Burnt Garlic Fried Rice", "Mains", 385, true, "Rice tossed with caramelized garlic, spring onions, and soy."],
    ["Hakka Noodles", "Mains", 385, true, "Stir-fried noodles with mixed vegetables, soy, and light vinegar."],
    ["Sichuan Noodles", "Mains", 385, true, "Noodles tossed with chilli oil, garlic, and peppercorn warmth."],
    ["Burnt Garlic Noodles", "Mains", 385, true, "Noodles tossed in butter, burnt garlic, and herbs."],

    // Indian breads & rice
    ["Tandoori Roti - Plain", "Sides", 95, true],
    ["Tandoori Roti - Butter", "Sides", 95, true],
    ["Tandoori Laccha Paratha - Plain", "Sides", 95, true],
    ["Tandoori Laccha Paratha - Butter", "Sides", 95, true],
    ["Tandoori Naan - Plain", "Sides", 95, true],
    ["Tandoori Naan - Butter", "Sides", 95, true],
    ["Tandoori Naan - Garlic Butter", "Sides", 95, true],
    ["Tandoori Kulcha - Plain", "Sides", 95, true],
    ["Tandoori Kulcha - Butter", "Sides", 95, true],
    ["Tandoori Kulcha - Garlic Butter", "Sides", 95, true],
    ["Tandoori Cheese Naan", "Sides", 125, true],
    ["Tandoori Cheese Kulcha", "Sides", 125, true],
    ["Steamed Rice", "Sides", 195, true],
    ["Ghee Rice", "Sides", 285, true],
    ["Jeera Rice", "Sides", 285, true],
    ["Curd Rice", "Sides", 285, true],
    ["Veg Dum Biryani", "Mains", 395, true, "Layered basmati rice with vegetables, saffron, and spices on dum."],
    ["Kathal Biryani", "Mains", 425, true, "Fragrant basmati rice layered with spiced jackfruit masala and aromatic spices."],

    // Desserts
    ["Double Chocolate Walnut Brownie", "Desserts", 355, true, "Dense, rich brownie loaded with deep double chocolate flavour."],
    ["Rose Milk Tres Leches", "Desserts", 415, true, "Milk-soaked sponge finished with delicate rose milk sweetness."],
    ["Berry Cheesecake", "Desserts", 415, true, "Creamy cheesecake balanced with a smooth berry finish."],
    ["Pineapple Custard", "Desserts", 415, true, "Creamy pineapple dessert with soft custard and fruity sweetness."],
    ["Tiramisu", "Desserts", 415, true, "Classic Italian dessert layered with coffee, cream, and cocoa."],
    ["Flourless Chocolate Cake", "Desserts", 415, true, "Dense chocolate cake with an intense cocoa-rich finish."],
    ["Lotus Biscoff Ice Cream Cake", "Desserts", 415, true, "Creamy ice cream cake layered with Lotus Biscoff flavour."],
    ["Chocolate Ice Cream Cake", "Desserts", 415, true, "Chilled chocolate dessert with layers of cake and ice cream."],
    ["Rose Petal Ice Cream Cake", "Desserts", 415, true, "Delicate ice cream cake with subtle rose petal notes."],
  ],
};

export const restaurantMenus: Record<string, MenuItem[]> = Object.fromEntries(
  Object.entries(menus).map(([restaurantId, items]) => [
    restaurantId,
    items.map(([name, category, price, vegetarian, description], index) => ({
      id: `${restaurantId}-${index + 1}`,
      name,
      category,
      price,
      vegetarian,
      ...(description ? { description } : {}),
    })),
  ]),
);