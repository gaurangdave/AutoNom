#!/usr/bin/env python3
"""
Generate synthetic restaurant dataset for food ordering application.
Creates 50 diverse restaurants with realistic menus for AI Agent testing.
"""

import json
import random
from pathlib import Path
from typing import List, Dict, Any
from faker import Faker


# Configuration
OUTPUT_PATH = Path(__file__).parent.parent / "data" / "restaurants.json"
NUM_RESTAURANTS = 100
fake = Faker()

# Cuisine-specific data
CUISINES = {
    "Japanese": {
        "prefixes": ["Sakura", "Tokyo", "Zen", "Hana", "Matsu", "Koi", "Miso", "Ramen"],
        "suffixes": ["House", "Kitchen", "Bistro", "Bar", "Express", "Garden", "Spot"],
        "dishes": [
            ("Spicy Tuna Roll", "Fresh tuna with spicy mayo and cucumber wrapped in seasoned rice.", ["Contains-Fish", "Spicy"]),
            ("Chicken Teriyaki Bowl", "Grilled chicken glazed with sweet teriyaki sauce over steamed rice.", ["High-Protein", "Gluten-Free"]),
            ("Vegetable Tempura", "Crispy battered seasonal vegetables served with dipping sauce.", ["Vegetarian", "Contains-Eggs"]),
            ("Miso Ramen", "Rich pork broth with noodles, soft-boiled egg, and green onions.", ["Contains-Eggs", "High-Protein"]),
            ("Salmon Sashimi Platter", "Fresh Atlantic salmon sliced thin and served with wasabi and soy sauce.", ["Contains-Fish", "Gluten-Free", "High-Protein"]),
            ("Tofu Stir Fry", "Crispy tofu with mixed vegetables in a savory sauce.", ["Vegan", "High-Protein"]),
            ("Dragon Roll", "Eel and cucumber topped with avocado and eel sauce.", ["Contains-Fish"]),
            ("Tonkotsu Ramen", "Creamy pork bone broth with chashu pork, bamboo shoots, and nori.", ["High-Protein"]),
            ("California Roll", "Crab, avocado, and cucumber wrapped in rice and seaweed.", ["Contains-Fish"]),
            ("Beef Gyoza", "Pan-fried dumplings filled with seasoned ground beef and vegetables.", ["High-Protein"]),
            ("Edamame", "Steamed young soybeans lightly salted.", ["Vegan", "Gluten-Free", "High-Protein"]),
            ("Katsu Curry", "Breaded pork cutlet with Japanese curry sauce over rice.", ["High-Protein", "Spicy"]),
            ("Udon Noodle Soup", "Thick wheat noodles in savory dashi broth with tempura.", ["Vegetarian"]),
            ("Yakitori Skewers", "Grilled chicken skewers glazed with tare sauce.", ["High-Protein", "Gluten-Free"]),
            ("Agedashi Tofu", "Deep-fried tofu in warm dashi broth with ginger and green onions.", ["Vegan"]),
        ],
        "tags": ["Fresh Fish", "Sushi", "Ramen", "Authentic", "Quick Service"]
    },
    "Italian": {
        "prefixes": ["Bella", "Luigi's", "Olive", "Roma", "Tuscany", "Venice", "Antonio's"],
        "suffixes": ["Trattoria", "Kitchen", "Ristorante", "Pizzeria", "Cafe", "House"],
        "dishes": [
            ("Margherita Pizza", "Classic pizza with fresh mozzarella, basil, and San Marzano tomatoes.", ["Vegetarian"]),
            ("Spaghetti Carbonara", "Creamy pasta with pancetta, eggs, and Parmesan cheese.", ["Contains-Eggs", "High-Protein"]),
            ("Chicken Parmigiana", "Breaded chicken breast topped with marinara and melted mozzarella.", ["High-Protein"]),
            ("Mushroom Risotto", "Creamy arborio rice cooked with wild mushrooms and parmesan.", ["Vegetarian", "Gluten-Free"]),
            ("Lasagna Bolognese", "Layered pasta with rich meat sauce and béchamel.", ["High-Protein"]),
            ("Caprese Salad", "Fresh mozzarella, tomatoes, and basil drizzled with balsamic glaze.", ["Vegetarian", "Gluten-Free"]),
            ("Eggplant Parmigiana", "Breaded eggplant layered with marinara and melted cheese.", ["Vegetarian"]),
            ("Fettuccine Alfredo", "Ribbon pasta tossed in rich parmesan cream sauce.", ["Vegetarian"]),
            ("Osso Buco", "Braised veal shanks in white wine with gremolata.", ["High-Protein", "Gluten-Free"]),
            ("Penne Arrabbiata", "Pasta in spicy tomato sauce with garlic and red chili flakes.", ["Vegan", "Spicy"]),
            ("Seafood Risotto", "Creamy rice with shrimp, mussels, and calamari.", ["Contains-Fish", "Gluten-Free"]),
            ("Bruschetta", "Toasted bread topped with fresh tomatoes, garlic, and basil.", ["Vegan"]),
            ("Ravioli Ricotta", "Fresh pasta pillows filled with ricotta and spinach in butter sage sauce.", ["Vegetarian"]),
            ("Prosciutto e Melone", "Thin-sliced cured ham with sweet cantaloupe melon.", ["Gluten-Free", "High-Protein"]),
            ("Tiramisu", "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone.", ["Contains-Eggs", "Vegetarian"]),
        ],
        "tags": ["Pasta", "Pizza", "Family-Friendly", "Comfort Food", "Wine Selection"]
    },
    "Mexican": {
        "prefixes": ["El", "La", "Casa", "Taco", "Chipotle", "Aztec", "Frida's"],
        "suffixes": ["Cantina", "Grill", "Kitchen", "Express", "Taqueria", "Cocina"],
        "dishes": [
            ("Chicken Tacos", "Soft corn tortillas filled with seasoned chicken, cilantro, and onions.", ["Gluten-Free", "High-Protein"]),
            ("Vegetarian Burrito Bowl", "Rice, black beans, guacamole, salsa, and fresh vegetables.", ["Vegan", "Gluten-Free"]),
            ("Beef Enchiladas", "Corn tortillas filled with beef and topped with red chili sauce.", ["Gluten-Free", "Spicy", "High-Protein"]),
            ("Guacamole & Chips", "Fresh avocado dip served with crispy tortilla chips.", ["Vegan", "Gluten-Free"]),
            ("Fish Tacos", "Grilled fish with cabbage slaw and chipotle mayo in flour tortillas.", ["Contains-Fish", "Spicy"]),
            ("Chile Relleno", "Roasted poblano pepper stuffed with cheese and fried in egg batter.", ["Vegetarian", "Contains-Eggs", "Spicy"]),
            ("Carnitas Plate", "Slow-cooked pork served with rice, beans, and tortillas.", ["High-Protein", "Gluten-Free"]),
            ("Quesadilla", "Grilled flour tortilla filled with melted cheese and vegetables.", ["Vegetarian"]),
            ("Carne Asada", "Grilled marinated steak with rice, beans, and warm tortillas.", ["High-Protein", "Gluten-Free"]),
            ("Elote", "Mexican street corn with mayo, cotija cheese, and chili powder.", ["Vegetarian", "Gluten-Free"]),
            ("Pozole Rojo", "Traditional hominy soup with pork in red chili broth.", ["High-Protein", "Gluten-Free", "Spicy"]),
            ("Tamales", "Corn masa filled with chicken and green salsa, steamed in corn husks.", ["Gluten-Free", "High-Protein"]),
            ("Nachos Supreme", "Tortilla chips loaded with cheese, beans, jalapeños, and sour cream.", ["Vegetarian"]),
            ("Tostadas", "Crispy corn tortillas topped with refried beans, lettuce, and salsa.", ["Vegan", "Gluten-Free"]),
            ("Churros", "Fried dough pastry rolled in cinnamon sugar with chocolate dipping sauce.", ["Vegetarian"]),
        ],
        "tags": ["Spicy Options", "Fresh Ingredients", "Authentic", "Catering Available", "Margaritas"]
    },
    "Indian": {
        "prefixes": ["Taj", "Spice", "Curry", "Mumbai", "Delhi", "Royal", "Bombay"],
        "suffixes": ["Palace", "Kitchen", "House", "Express", "Grill", "Cuisine"],
        "dishes": [
            ("Chicken Tikka Masala", "Tender chicken in a creamy tomato-based curry sauce.", ["High-Protein", "Spicy"]),
            ("Vegetable Samosas", "Crispy pastry filled with spiced potatoes and peas.", ["Vegan"]),
            ("Lamb Vindaloo", "Spicy lamb curry with potatoes in a tangy sauce.", ["Spicy", "High-Protein", "Gluten-Free"]),
            ("Palak Paneer", "Creamy spinach curry with cubes of fresh Indian cheese.", ["Vegetarian", "Gluten-Free"]),
            ("Chana Masala", "Chickpeas simmered in aromatic spices and tomato gravy.", ["Vegan", "Gluten-Free", "High-Protein"]),
            ("Butter Chicken", "Marinated chicken in a rich, buttery tomato cream sauce.", ["High-Protein", "Spicy"]),
            ("Dal Tadka", "Yellow lentils tempered with cumin, garlic, and ghee.", ["Vegan", "Gluten-Free", "High-Protein"]),
            ("Biryani", "Fragrant basmati rice with spiced chicken and saffron.", ["High-Protein", "Gluten-Free", "Spicy"]),
            ("Naan Bread", "Soft leavened flatbread baked in a tandoor oven.", ["Vegetarian"]),
            ("Tandoori Chicken", "Yogurt-marinated chicken roasted in a clay oven.", ["High-Protein", "Gluten-Free", "Spicy"]),
            ("Saag Paneer", "Indian cheese cubes in creamy mustard greens sauce.", ["Vegetarian", "Gluten-Free"]),
            ("Aloo Gobi", "Cauliflower and potatoes cooked with turmeric and cumin.", ["Vegan", "Gluten-Free"]),
            ("Chicken Korma", "Mild chicken curry in a creamy coconut and cashew sauce.", ["High-Protein", "Contains-Nuts"]),
            ("Bhindi Masala", "Okra sautéed with onions, tomatoes, and aromatic spices.", ["Vegan", "Gluten-Free"]),
            ("Gulab Jamun", "Sweet milk dumplings soaked in fragrant rose syrup.", ["Vegetarian"]),
        ],
        "tags": ["Spicy", "Vegetarian Options", "Authentic Flavors", "Lunch Buffet", "Family-Owned"]
    },
    "American": {
        "prefixes": ["Big", "Johnny's", "Liberty", "Main Street", "All-American", "Classic"],
        "suffixes": ["Diner", "Grill", "Burger", "BBQ", "Kitchen", "Smokehouse"],
        "dishes": [
            ("Classic Cheeseburger", "Juicy beef patty with cheddar, lettuce, tomato, and pickles.", ["High-Protein"]),
            ("BBQ Pulled Pork Sandwich", "Slow-smoked pork shoulder with tangy BBQ sauce on a brioche bun.", ["High-Protein"]),
            ("Buffalo Wings", "Crispy chicken wings tossed in spicy buffalo sauce.", ["High-Protein", "Spicy", "Gluten-Free"]),
            ("Mac and Cheese", "Creamy elbow pasta with a rich cheddar cheese sauce.", ["Vegetarian"]),
            ("Grilled Salmon", "Fresh Atlantic salmon with lemon butter and seasonal vegetables.", ["Contains-Fish", "Gluten-Free", "High-Protein"]),
            ("Caesar Salad", "Crisp romaine with parmesan, croutons, and Caesar dressing.", ["Vegetarian"]),
            ("Veggie Burger", "House-made black bean patty with avocado and sprouts.", ["Vegan"]),
            ("Philly Cheesesteak", "Thinly sliced steak with melted cheese on a hoagie roll.", ["High-Protein"]),
            ("Baby Back Ribs", "Tender pork ribs slow-cooked and glazed with BBQ sauce.", ["High-Protein", "Gluten-Free"]),
            ("Chicken Tenders", "Crispy breaded chicken strips with honey mustard dipping sauce.", ["High-Protein"]),
            ("Loaded Fries", "French fries topped with cheese, bacon, and sour cream.", ["Vegetarian"]),
            ("Club Sandwich", "Triple-decker with turkey, bacon, lettuce, and tomato.", ["High-Protein"]),
            ("Meatloaf", "Classic beef meatloaf with mashed potatoes and gravy.", ["High-Protein"]),
            ("Cobb Salad", "Mixed greens with chicken, avocado, bacon, egg, and blue cheese.", ["High-Protein", "Gluten-Free", "Contains-Eggs"]),
            ("Apple Pie", "Traditional American apple pie with flaky crust and vanilla ice cream.", ["Vegetarian"]),
        ],
        "tags": ["Comfort Food", "Burgers", "BBQ", "Late Night", "Sports Bar"]
    },
    "Vegan": {
        "prefixes": ["Green", "Pure", "Plant", "Earthen", "Veggie", "Fresh", "Conscious"],
        "suffixes": ["Bowl", "Kitchen", "Cafe", "Garden", "Eats", "Bites"],
        "dishes": [
            ("Buddha Bowl", "Quinoa, roasted vegetables, chickpeas, and tahini dressing.", ["Vegan", "Gluten-Free", "High-Protein"]),
            ("Beyond Burger", "Plant-based patty with vegan cheese, lettuce, and tomato.", ["Vegan"]),
            ("Falafel Wrap", "Crispy chickpea fritters with hummus and fresh vegetables in pita.", ["Vegan"]),
            ("Acai Bowl", "Acai puree topped with granola, fresh berries, and coconut.", ["Vegan", "Gluten-Free"]),
            ("Jackfruit Tacos", "Seasoned pulled jackfruit with avocado and pico de gallo.", ["Vegan", "Gluten-Free"]),
            ("Lentil Soup", "Hearty red lentils with vegetables and aromatic spices.", ["Vegan", "Gluten-Free", "High-Protein"]),
            ("Vegan Pad Thai", "Rice noodles with tofu, vegetables, and peanut sauce.", ["Vegan", "Gluten-Free", "Contains-Nuts"]),
            ("Cauliflower Wings", "Crispy battered cauliflower tossed in buffalo sauce.", ["Vegan", "Spicy"]),
            ("Vegan Pizza", "Thin crust pizza with cashew cheese, vegetables, and fresh basil.", ["Vegan", "Contains-Nuts"]),
            ("Veggie Pho", "Vietnamese rice noodle soup with tofu and fresh herbs.", ["Vegan", "Gluten-Free"]),
            ("Quinoa Salad", "Protein-packed quinoa with roasted vegetables and lemon dressing.", ["Vegan", "Gluten-Free", "High-Protein"]),
            ("Mushroom Burger", "Grilled portobello mushroom cap with vegan aioli and arugula.", ["Vegan"]),
            ("Tofu Scramble", "Seasoned tofu with peppers, onions, and spinach.", ["Vegan", "Gluten-Free", "High-Protein"]),
            ("Vegan Sushi Roll", "Cucumber, avocado, and carrot wrapped in seasoned rice and nori.", ["Vegan", "Gluten-Free"]),
            ("Coconut Curry", "Mixed vegetables in creamy coconut curry sauce over rice.", ["Vegan", "Gluten-Free"]),
        ],
        "tags": ["100% Vegan", "Organic", "Gluten-Free Options", "Sustainable", "Health-Conscious"]
    },
    "Thai": {
        "prefixes": ["Thai", "Bangkok", "Siam", "Golden", "Lotus", "Chiang Mai"],
        "suffixes": ["Kitchen", "House", "Express", "Bistro", "Garden", "Spot"],
        "dishes": [
            ("Pad Thai", "Stir-fried rice noodles with shrimp, peanuts, and tamarind sauce.", ["Contains-Fish", "Contains-Nuts", "Spicy"]),
            ("Green Curry", "Coconut-based curry with chicken, bamboo shoots, and Thai basil.", ["Spicy", "High-Protein", "Gluten-Free"]),
            ("Tom Yum Soup", "Spicy and sour soup with shrimp, lemongrass, and lime.", ["Contains-Fish", "Spicy", "Gluten-Free"]),
            ("Mango Sticky Rice", "Sweet coconut sticky rice topped with fresh mango slices.", ["Vegan", "Gluten-Free"]),
            ("Massaman Curry", "Mild peanut curry with beef, potatoes, and roasted peanuts.", ["Spicy", "Contains-Nuts", "High-Protein"]),
            ("Vegetable Spring Rolls", "Crispy rolls filled with vegetables served with sweet chili sauce.", ["Vegan"]),
            ("Drunken Noodles", "Wide rice noodles with basil, vegetables, and choice of protein.", ["Spicy", "High-Protein"]),
            ("Red Curry", "Spicy red curry with bamboo shoots, bell peppers, and basil.", ["Spicy", "Gluten-Free", "High-Protein"]),
            ("Pad See Ew", "Wide rice noodles stir-fried with chicken, egg, and Chinese broccoli.", ["Contains-Eggs", "High-Protein"]),
            ("Tom Kha Gai", "Coconut chicken soup with galangal, lemongrass, and mushrooms.", ["Gluten-Free", "High-Protein"]),
            ("Larb Gai", "Spicy minced chicken salad with lime, mint, and toasted rice.", ["Spicy", "Gluten-Free", "High-Protein"]),
            ("Papaya Salad", "Shredded green papaya with tomatoes, peanuts, and chili-lime dressing.", ["Vegan", "Gluten-Free", "Spicy", "Contains-Nuts"]),
            ("Thai Basil Chicken", "Stir-fried chicken with holy basil, chili, and garlic.", ["Spicy", "Gluten-Free", "High-Protein"]),
            ("Panang Curry", "Rich peanut curry with kaffir lime leaves and vegetables.", ["Contains-Nuts", "Gluten-Free", "Spicy"]),
            ("Pad Krapow Moo", "Spicy stir-fried pork with Thai basil over jasmine rice.", ["Spicy", "Gluten-Free", "High-Protein"]),
        ],
        "tags": ["Spicy", "Authentic Thai", "Fresh Herbs", "Vegetarian Options", "Quick Delivery"]
    },
    "Mediterranean": {
        "prefixes": ["Olive", "Athens", "Cyprus", "Mediterranean", "Santorini", "Aegean"],
        "suffixes": ["Grill", "Kitchen", "Cafe", "Taverna", "House", "Express"],
        "dishes": [
            ("Chicken Shawarma Plate", "Marinated grilled chicken with hummus, rice, and salad.", ["High-Protein", "Gluten-Free"]),
            ("Falafel Platter", "Crispy chickpea fritters with tahini, pita, and pickled vegetables.", ["Vegan"]),
            ("Greek Salad", "Tomatoes, cucumber, feta, olives, and red onion with olive oil.", ["Vegetarian", "Gluten-Free"]),
            ("Lamb Kebab", "Grilled marinated lamb skewers with tzatziki and rice.", ["High-Protein", "Gluten-Free"]),
            ("Hummus Mezze", "Creamy chickpea dip with warm pita and olive oil.", ["Vegan"]),
            ("Spanakopita", "Flaky phyllo pastry filled with spinach and feta cheese.", ["Vegetarian"]),
            ("Grilled Octopus", "Tender octopus with lemon, olive oil, and herbs.", ["Contains-Fish", "Gluten-Free", "High-Protein"]),
            ("Moussaka", "Layered eggplant casserole with ground beef and béchamel sauce.", ["High-Protein"]),
            ("Baba Ganoush", "Smoky roasted eggplant dip with tahini and garlic.", ["Vegan", "Gluten-Free"]),
            ("Gyro Wrap", "Seasoned beef and lamb with tzatziki, tomatoes, and onions in pita.", ["High-Protein"]),
            ("Tabbouleh", "Fresh parsley salad with bulgur, tomatoes, and lemon dressing.", ["Vegan"]),
            ("Stuffed Grape Leaves", "Rice and herb filling wrapped in tender grape leaves.", ["Vegan", "Gluten-Free"]),
            ("Mixed Grill Platter", "Assorted grilled meats with grilled vegetables and rice.", ["High-Protein", "Gluten-Free"]),
            ("Lentil Stew", "Hearty Mediterranean lentil stew with vegetables and spices.", ["Vegan", "Gluten-Free", "High-Protein"]),
            ("Baklava", "Sweet pastry layers with honey and crushed pistachios.", ["Vegetarian", "Contains-Nuts"]),
        ],
        "tags": ["Healthy Options", "Fresh Ingredients", "Mediterranean Diet", "Halal", "Family-Style"]
    },
    "Cafe": {
        "prefixes": ["Sunrise", "Corner", "Urban", "Morning", "Daily", "Cozy", "Artisan"],
        "suffixes": ["Cafe", "Coffee", "Roasters", "Brew", "Espresso", "Coffeehouse"],
        "dishes": [
            ("Avocado Toast", "Sourdough toast topped with smashed avocado, cherry tomatoes, and feta.", ["Vegetarian"]),
            ("Breakfast Burrito", "Scrambled eggs, bacon, cheese, and salsa wrapped in a flour tortilla.", ["Contains-Eggs", "High-Protein"]),
            ("Croissant Sandwich", "Buttery croissant with ham, swiss cheese, and Dijon mustard.", ["Contains-Eggs", "High-Protein"]),
            ("Greek Yogurt Parfait", "Layers of yogurt, granola, fresh berries, and honey.", ["Vegetarian", "Gluten-Free"]),
            ("Caprese Panini", "Grilled sandwich with fresh mozzarella, tomato, and basil pesto.", ["Vegetarian"]),
            ("Quiche Lorraine", "Savory egg pie with bacon, cheese, and caramelized onions.", ["Contains-Eggs", "High-Protein"]),
            ("Bagel & Lox", "Toasted bagel with cream cheese, smoked salmon, and capers.", ["Contains-Fish", "High-Protein"]),
            ("Caesar Wrap", "Grilled chicken, romaine lettuce, and parmesan in a spinach tortilla.", ["High-Protein"]),
            ("Soup & Salad Combo", "Daily soup served with a fresh garden salad.", ["Vegetarian"]),
            ("Turkey Club", "Triple-decker sandwich with turkey, bacon, lettuce, and tomato.", ["High-Protein"]),
            ("Veggie Wrap", "Hummus, cucumber, carrots, sprouts, and avocado in a whole wheat wrap.", ["Vegan"]),
            ("Biscuits & Gravy", "Flaky buttermilk biscuits smothered in sausage gravy.", ["High-Protein"]),
            ("Fruit Salad", "Fresh seasonal fruit with a honey-lime dressing.", ["Vegan", "Gluten-Free"]),
            ("Grilled Cheese", "Classic sandwich with melted cheddar on sourdough bread.", ["Vegetarian"]),
            ("Chicken Salad Croissant", "Homemade chicken salad on a buttery croissant.", ["High-Protein", "Contains-Eggs"]),
        ],
        "tags": ["Coffee", "Breakfast All Day", "WiFi Available", "Cozy Atmosphere", "Fresh Baked Goods"]
    },
    "Dessert": {
        "prefixes": ["Sweet", "Sugar", "Decadent", "Delightful", "Heavenly", "Blissful", "Pure"],
        "suffixes": ["Bakery", "Desserts", "Sweets", "Treats", "Creamery", "Patisserie"],
        "dishes": [
            ("New York Cheesecake", "Rich and creamy cheesecake with graham cracker crust.", ["Vegetarian", "Contains-Eggs"]),
            ("Chocolate Lava Cake", "Warm chocolate cake with a molten chocolate center.", ["Vegetarian", "Contains-Eggs"]),
            ("Gelato Trio", "Three scoops of artisan Italian gelato in assorted flavors.", ["Vegetarian", "Gluten-Free"]),
            ("Crème Brûlée", "Classic French custard with caramelized sugar topping.", ["Vegetarian", "Contains-Eggs", "Gluten-Free"]),
            ("Tiramisu", "Layers of espresso-soaked ladyfingers and mascarpone cream.", ["Vegetarian", "Contains-Eggs"]),
            ("Macarons", "Delicate French almond cookies in assorted flavors.", ["Vegetarian", "Contains-Eggs", "Contains-Nuts"]),
            ("Brownie Sundae", "Warm fudge brownie topped with vanilla ice cream and hot fudge.", ["Vegetarian", "Contains-Eggs", "Contains-Nuts"]),
            ("Fruit Tart", "Buttery tart shell filled with pastry cream and fresh seasonal fruit.", ["Vegetarian", "Contains-Eggs"]),
            ("Cannoli", "Crispy pastry shells filled with sweet ricotta cream and chocolate chips.", ["Vegetarian", "Contains-Eggs"]),
            ("Churros", "Fried dough pastries dusted with cinnamon sugar and chocolate sauce.", ["Vegetarian"]),
            ("Panna Cotta", "Silky Italian cream dessert with berry compote.", ["Vegetarian", "Gluten-Free"]),
            ("Banana Split", "Three scoops of ice cream with banana, whipped cream, and toppings.", ["Vegetarian", "Contains-Nuts"]),
            ("Red Velvet Cake", "Moist red velvet layers with cream cheese frosting.", ["Vegetarian", "Contains-Eggs"]),
            ("Apple Crumble", "Warm spiced apples topped with buttery oat crumble and vanilla ice cream.", ["Vegetarian"]),
            ("Profiteroles", "Cream puffs filled with vanilla custard and drizzled with chocolate.", ["Vegetarian", "Contains-Eggs"]),
        ],
        "tags": ["Dessert Only", "Custom Cakes", "Instagram-Worthy", "Artisan", "Sweet Tooth Heaven"]
    }
}

# Additional restaurant tags
ADDITIONAL_TAGS = [
    "Fast Delivery", "Late Night", "Outdoor Seating", "Free Delivery", 
    "Locally Sourced", "Award Winning", "Chef's Specials", "Catering Available"
]


def generate_restaurant_name(cuisine: str) -> str:
    """Generate a creative restaurant name based on cuisine."""
    cuisine_data = CUISINES[cuisine]
    
    # Use a mix of Faker-generated names and cuisine-specific names
    if random.random() < 0.4:
        # Use Faker for more realistic business names
        company_name = fake.company()
        # Clean up common suffixes that don't fit restaurants
        for suffix in [" Inc", " LLC", " Ltd", " Group", " and Sons", "-"]:
            company_name = company_name.replace(suffix, "")
        
        # Add cuisine-specific suffix
        suffix = random.choice(cuisine_data["suffixes"])
        return f"{company_name} {suffix}"
    else:
        # Use traditional cuisine-specific naming
        prefix = random.choice(cuisine_data["prefixes"])
        suffix = random.choice(cuisine_data["suffixes"])
        
        # Sometimes just use prefix or suffix alone
        if random.random() < 0.3:
            return f"{prefix}'s"
        elif random.random() < 0.2:
            return f"The {prefix} {suffix}"
        else:
            return f"{prefix} {suffix}"


def generate_menu_item(cuisine: str, restaurant_id: str, item_index: int) -> Dict[str, Any]:
    """Generate a single menu item for a restaurant."""
    cuisine_data = CUISINES[cuisine]
    dish_name, description, dietary_tags = random.choice(cuisine_data["dishes"])
    
    return {
        "id": f"{restaurant_id}_m_{item_index:03d}",
        "name": dish_name,
        "description": description,
        "price": round(random.uniform(10.0, 35.0), 2),
        "calories": random.randint(300, 1200),
        "dietary_tags": dietary_tags
    }


def generate_restaurant(restaurant_index: int) -> Dict[str, Any]:
    """Generate a complete restaurant object."""
    restaurant_id = f"r_{restaurant_index:03d}"
    cuisine = random.choice(list(CUISINES.keys()))
    
    # Generate base tags from cuisine
    cuisine_tags = random.sample(CUISINES[cuisine]["tags"], k=random.randint(2, 4))
    
    # Add some additional random tags
    extra_tags = random.sample(ADDITIONAL_TAGS, k=random.randint(1, 2))
    all_tags = cuisine_tags + extra_tags
    
    # Generate menu items (3-5 items per restaurant)
    num_menu_items = random.randint(10, 30)
    menu = []
    used_dishes = set()
    
    for i in range(num_menu_items):
        # Ensure variety in menu items
        attempts = 0
        while attempts < 20:  # Prevent infinite loop
            menu_item = generate_menu_item(cuisine, restaurant_id, i + 1)
            if menu_item["name"] not in used_dishes:
                used_dishes.add(menu_item["name"])
                menu.append(menu_item)
                break
            attempts += 1
    
    return {
        "id": restaurant_id,
        "name": generate_restaurant_name(cuisine),
        "cuisine": cuisine,
        "rating": round(random.uniform(3.5, 5.0), 1),
        "delivery_time_min": random.choice([20, 25, 30, 35, 40, 45, 50, 60]),
        "tags": all_tags,
        "menu": menu
    }


def ensure_dietary_diversity(restaurants: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Ensure at least 20% of items are vegan or vegetarian."""
    total_items = sum(len(r["menu"]) for r in restaurants)
    vegan_vegetarian_count = 0
    
    for restaurant in restaurants:
        for item in restaurant["menu"]:
            if "Vegan" in item["dietary_tags"] or "Vegetarian" in item["dietary_tags"]:
                vegan_vegetarian_count += 1
    
    vegan_percentage = (vegan_vegetarian_count / total_items) * 100
    print(f"  → {vegan_vegetarian_count}/{total_items} items are Vegan/Vegetarian ({vegan_percentage:.1f}%)")
    
    return restaurants


def generate_dataset() -> List[Dict[str, Any]]:
    """Generate the complete restaurant dataset."""
    print(f"Generating {NUM_RESTAURANTS} restaurants...")
    
    restaurants = []
    for i in range(1, NUM_RESTAURANTS + 1):
        restaurant = generate_restaurant(i)
        restaurants.append(restaurant)
        
        if i % 10 == 0:
            print(f"  → Generated {i} restaurants...")
    
    # Ensure dietary diversity
    restaurants = ensure_dietary_diversity(restaurants)
    
    return restaurants


def save_to_file(restaurants: List[Dict[str, Any]]) -> None:
    """Save the restaurant dataset to JSON file."""
    # Ensure the data directory exists
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Write to file with pretty printing
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(restaurants, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Generated {len(restaurants)} restaurants to {OUTPUT_PATH}")
    
    # Print some statistics
    total_items = sum(len(r["menu"]) for r in restaurants)
    cuisines_count = {}
    for r in restaurants:
        cuisines_count[r["cuisine"]] = cuisines_count.get(r["cuisine"], 0) + 1
    
    print(f"\nDataset Statistics:")
    print(f"  → Total restaurants: {len(restaurants)}")
    print(f"  → Total menu items: {total_items}")
    print(f"  → Cuisine distribution:")
    for cuisine, count in sorted(cuisines_count.items()):
        print(f"      • {cuisine}: {count}")


def main():
    """Main entry point."""
    print("=" * 60)
    print("Restaurant Dataset Generator")
    print("=" * 60)
    
    restaurants = generate_dataset()
    save_to_file(restaurants)
    
    print("\n" + "=" * 60)
    print("Done! Dataset is ready for use.")
    print("=" * 60)


if __name__ == "__main__":
    main()
