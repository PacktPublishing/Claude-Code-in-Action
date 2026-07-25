const quizQuestions = [
    {
        id: 12,
        category: "World Geography",
        difficulty: "medium",
        question: "What is the longest river in the world?",
        options: ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
        correctAnswer: 1,
        explanation: "The Nile River is about 6,650 km long, making it the longest river in the world."
    },
    // History (13 questions)
    {
        id: 1,
        category: "History",
        difficulty: "easy",
        question: "Who was the first President of the United States?",
        options: ["George Washington", "Thomas Jefferson", "John Adams", "Abraham Lincoln"],
        correctAnswer: 0,
        explanation: "George Washington became the first President of the United States in 1789."
    },
    {
        id: 2,
        category: "History",
        difficulty: "medium",
        question: "Who was the first emperor of Rome?",
        options: ["Julius Caesar", "Augustus", "Nero", "Caligula"],
        correctAnswer: 1,
        explanation: "Augustus became the first Roman emperor in 27 BC."
    },
    {
        id: 3,
        category: "History",
        difficulty: "medium",
        question: "In what year did Columbus first reach the Americas?",
        options: ["1392", "1492", "1592", "1692"],
        correctAnswer: 1,
        explanation: "Christopher Columbus reached the Americas in 1492."
    },
    {
        id: 4,
        category: "History",
        difficulty: "hard",
        question: "What was the capital of the Byzantine Empire?",
        options: ["Rome", "Athens", "Constantinople", "Alexandria"],
        correctAnswer: 2,
        explanation: "Constantinople (present-day Istanbul) was the capital of the Byzantine Empire."
    },
    {
        id: 5,
        category: "History",
        difficulty: "medium",
        question: "In what year did World War I begin?",
        options: ["1905", "1914", "1918", "1939"],
        correctAnswer: 1,
        explanation: "World War I began in 1914, following the assassination of Archduke Franz Ferdinand."
    },
    {
        id: 6,
        category: "History",
        difficulty: "easy",
        question: "Which English king had six wives?",
        options: ["Henry VIII", "Richard III", "Edward VI", "George III"],
        correctAnswer: 0,
        explanation: "Henry VIII, who ruled England from 1509 to 1547, married six times."
    },
    {
        id: 7,
        category: "History",
        difficulty: "hard",
        question: "Who founded the Mongol Empire?",
        options: ["Kublai Khan", "Genghis Khan", "Attila", "Tamerlane"],
        correctAnswer: 1,
        explanation: "Genghis Khan founded the Mongol Empire in 1206."
    },
    {
        id: 8,
        category: "History",
        difficulty: "medium",
        question: "Which of these ancient civilizations emerged first?",
        options: ["Sumerian", "Ancient Egyptian", "Indus Valley", "Ancient Chinese"],
        correctAnswer: 0,
        explanation: "The Sumerian civilization emerged in Mesopotamia around 3500 BC, making it one of the earliest known civilizations."
    },
    {
        id: 9,
        category: "History",
        difficulty: "easy",
        question: "On what date did World War II officially end?",
        options: ["May 8, 1943", "September 2, 1945", "June 6, 1944", "July 27, 1953"],
        correctAnswer: 1,
        explanation: "World War II officially ended on September 2, 1945, with Japan's formal surrender."
    },
    {
        id: 10,
        category: "History",
        difficulty: "medium",
        question: "What is the oldest university in Europe?",
        options: ["Oxford", "Bologna", "Sorbonne", "Cambridge"],
        correctAnswer: 1,
        explanation: "The University of Bologna, founded in 1088, is the oldest university in Europe."
    },
    {
        id: 41,
        category: "History",
        difficulty: "medium",
        question: "What was the chief governing council of ancient Rome?",
        options: ["The Senate", "The Forum", "The Assembly", "The Tribunal"],
        correctAnswer: 0,
        explanation: "The Senate was the chief governing and advisory council of ancient Rome."
    },
    {
        id: 42,
        category: "History",
        difficulty: "hard",
        question: "Which economist wrote 'The Wealth of Nations'?",
        options: ["David Ricardo", "Adam Smith", "John Locke", "Thomas Malthus"],
        correctAnswer: 1,
        explanation: "Adam Smith published 'The Wealth of Nations' in 1776, laying the foundations of modern economics."
    },
    {
        id: 43,
        category: "History",
        difficulty: "hard",
        question: "In which city was the League of Nations headquartered?",
        options: ["Brussels", "The Hague", "Vienna", "Geneva"],
        correctAnswer: 3,
        explanation: "The League of Nations was headquartered in Geneva, Switzerland, from its founding in 1920. It was later succeeded by the United Nations."
    },
    {
        id: 44,
        category: "History",
        difficulty: "hard",
        question: "Which of the following was NOT one of the Allied 'Big Three' leaders of World War II?",
        options: ["Winston Churchill", "Franklin D. Roosevelt", "Joseph Stalin", "Charles de Gaulle"],
        correctAnswer: 3,
        explanation: "The 'Big Three' were Churchill, Roosevelt, and Stalin. Charles de Gaulle led the Free French forces but was not part of the Big Three conferences."
    },

    // World Geography (10 questions)
    {
        id: 11,
        category: "World Geography",
        difficulty: "easy",
        question: "What is the largest continent in the world?",
        options: ["Africa", "Asia", "North America", "Antarctica"],
        correctAnswer: 1,
        explanation: "Asia is the largest continent in the world, covering about 44,579,000 km²."
    },
    {
        id: 13,
        category: "World Geography",
        difficulty: "easy",
        question: "What is the capital of Japan?",
        options: ["Osaka", "Kyoto", "Tokyo", "Yokohama"],
        correctAnswer: 2,
        explanation: "Tokyo is the capital and largest city of Japan."
    },
    {
        id: 14,
        category: "World Geography",
        difficulty: "hard",
        question: "What is the deepest ocean trench in the world?",
        options: ["Mariana Trench", "Tonga Trench", "Philippine Trench", "Puerto Rico Trench"],
        correctAnswer: 0,
        explanation: "The Challenger Deep in the Mariana Trench is the deepest point at about 11,034 m."
    },
    {
        id: 15,
        category: "World Geography",
        difficulty: "medium",
        question: "What is the largest desert in the world?",
        options: ["Sahara Desert", "Gobi Desert", "Antarctic Desert", "Arabian Desert"],
        correctAnswer: 2,
        explanation: "Antarctica is a polar desert of about 14 million km², the largest in the world."
    },
    {
        id: 16,
        category: "World Geography",
        difficulty: "easy",
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Rome"],
        correctAnswer: 2,
        explanation: "Paris is the capital and largest city of France."
    },
    {
        id: 17,
        category: "World Geography",
        difficulty: "medium",
        question: "What is the highest mountain in the world?",
        options: ["K2", "Everest", "Kangchenjunga", "Makalu"],
        correctAnswer: 1,
        explanation: "Mount Everest is the world's highest peak at 8,848.86 m above sea level."
    },
    {
        id: 18,
        category: "World Geography",
        difficulty: "hard",
        question: "What is the largest lake in the world?",
        options: ["Lake Baikal", "Lake Superior", "Caspian Sea", "Lake Victoria"],
        correctAnswer: 2,
        explanation: "The Caspian Sea is the world's largest lake at about 371,000 km²."
    },
    {
        id: 19,
        category: "World Geography",
        difficulty: "easy",
        question: "What is the capital of Italy?",
        options: ["Milan", "Venice", "Rome", "Naples"],
        correctAnswer: 2,
        explanation: "Rome is the capital of Italy."
    },
    {
        id: 20,
        category: "World Geography",
        difficulty: "medium",
        question: "What is the smallest country in the world?",
        options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
        correctAnswer: 1,
        explanation: "Vatican City is the smallest country in the world by area, at about 0.44 km²."
    },

    // Science (10 questions)
    {
        id: 21,
        category: "Science",
        difficulty: "easy",
        question: "What is the chemical formula for water?",
        options: ["H2O", "CO2", "O2", "H2O2"],
        correctAnswer: 0,
        explanation: "Water is H2O, made up of two hydrogen atoms and one oxygen atom."
    },
    {
        id: 22,
        category: "Science",
        difficulty: "medium",
        question: "What is the largest planet in the solar system?",
        options: ["Saturn", "Jupiter", "Uranus", "Neptune"],
        correctAnswer: 1,
        explanation: "Jupiter is the largest planet in the solar system, with a diameter of about 142,984 km."
    },
    {
        id: 23,
        category: "Science",
        difficulty: "easy",
        question: "What is the approximate speed of light per second?",
        options: ["300,000 km", "1,000,000 km", "30,000 km", "1,000 km"],
        correctAnswer: 0,
        explanation: "The speed of light in a vacuum is about 299,792 km per second."
    },
    {
        id: 24,
        category: "Science",
        difficulty: "hard",
        question: "Which scientists discovered the double helix structure of DNA?",
        options: ["Darwin", "Einstein", "Watson and Crick", "Mendel"],
        correctAnswer: 2,
        explanation: "James Watson and Francis Crick discovered the double helix structure of DNA in 1953."
    },
    {
        id: 25,
        category: "Science",
        difficulty: "medium",
        question: "Which element has atomic number 1?",
        options: ["Helium", "Hydrogen", "Lithium", "Carbon"],
        correctAnswer: 1,
        explanation: "Hydrogen (H) has atomic number 1 and is the lightest element."
    },
    {
        id: 26,
        category: "Science",
        difficulty: "easy",
        question: "What is the most abundant gas in Earth's atmosphere?",
        options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
        correctAnswer: 2,
        explanation: "Nitrogen makes up about 78% of the atmosphere."
    },
    {
        id: 27,
        category: "Science",
        difficulty: "medium",
        question: "What is absolute zero in degrees Celsius?",
        options: ["-100°C", "-273.15°C", "-373°C", "0°C"],
        correctAnswer: 1,
        explanation: "Absolute zero is -273.15°C, the lowest temperature theoretically possible."
    },
    {
        id: 28,
        category: "Science",
        difficulty: "hard",
        question: "What are the main products of photosynthesis?",
        options: ["Carbon dioxide and water", "Glucose and oxygen", "Nitrogen and hydrogen", "Methane and oxygen"],
        correctAnswer: 1,
        explanation: "Photosynthesis uses carbon dioxide and water to produce glucose and oxygen."
    },
    {
        id: 29,
        category: "Science",
        difficulty: "easy",
        question: "What is the largest organ in the human body?",
        options: ["Heart", "Liver", "Lungs", "Skin"],
        correctAnswer: 3,
        explanation: "The skin is the largest organ in the human body, accounting for about 16% of body weight."
    },
    {
        id: 30,
        category: "Science",
        difficulty: "medium",
        question: "Which scientist published the theory of relativity?",
        options: ["Newton", "Galileo", "Einstein", "Hawking"],
        correctAnswer: 2,
        explanation: "Albert Einstein published the special theory of relativity in 1905 and the general theory in 1915."
    },

    // Arts & Culture (10 questions)
    {
        id: 31,
        category: "Arts & Culture",
        difficulty: "easy",
        question: "Who painted the 'Mona Lisa'?",
        options: ["Picasso", "Van Gogh", "Da Vinci", "Michelangelo"],
        correctAnswer: 2,
        explanation: "Leonardo da Vinci painted the Mona Lisa around 1503-1519."
    },
    {
        id: 32,
        category: "Arts & Culture",
        difficulty: "medium",
        question: "How many symphonies did Beethoven compose in total?",
        options: ["5", "7", "9", "12"],
        correctAnswer: 2,
        explanation: "Ludwig van Beethoven composed a total of 9 symphonies."
    },
    {
        id: 33,
        category: "Arts & Culture",
        difficulty: "easy",
        question: "Which painter is famous for the 'Sunflowers' series?",
        options: ["Monet", "Van Gogh", "Renoir", "Cézanne"],
        correctAnswer: 1,
        explanation: "Vincent van Gogh painted the Sunflowers series in 1888-1889."
    },
    {
        id: 34,
        category: "Arts & Culture",
        difficulty: "hard",
        question: "Who painted 'Guernica'?",
        options: ["Dalí", "Picasso", "Miró", "Goya"],
        correctAnswer: 1,
        explanation: "Pablo Picasso painted Guernica in 1937, inspired by the Spanish Civil War."
    },
    {
        id: 35,
        category: "Arts & Culture",
        difficulty: "medium",
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Goethe", "Shakespeare", "Dante", "Homer"],
        correctAnswer: 1,
        explanation: "William Shakespeare wrote Romeo and Juliet around 1595."
    },
    {
        id: 36,
        category: "Arts & Culture",
        difficulty: "easy",
        question: "How many keys does a standard piano have?",
        options: ["52", "66", "88", "100"],
        correctAnswer: 2,
        explanation: "A modern piano typically has 88 keys (52 white keys and 36 black keys)."
    },
    {
        id: 37,
        category: "Arts & Culture",
        difficulty: "medium",
        question: "Who sculpted 'The Thinker'?",
        options: ["Rodin", "Michelangelo", "Bernini", "Donatello"],
        correctAnswer: 0,
        explanation: "Auguste Rodin completed 'The Thinker' in 1902."
    },
    {
        id: 38,
        category: "Arts & Culture",
        difficulty: "hard",
        question: "Which painting gave the Impressionist movement its name?",
        options: ["Water Lilies", "Impression, Sunrise", "Moulin Rouge", "The Starry Night"],
        correctAnswer: 1,
        explanation: "The name Impressionism comes from Claude Monet's 'Impression, Sunrise' (1872)."
    },
    {
        id: 39,
        category: "Arts & Culture",
        difficulty: "easy",
        question: "Which family of instruments does the violin belong to?",
        options: ["Woodwind", "String", "Brass", "Percussion"],
        correctAnswer: 1,
        explanation: "The violin is a string instrument played with a bow."
    },
    {
        id: 40,
        category: "Arts & Culture",
        difficulty: "medium",
        question: "Who wrote 'Don Quixote'?",
        options: ["Cervantes", "Tolstoy", "Dostoevsky", "Balzac"],
        correctAnswer: 0,
        explanation: "Miguel de Cervantes published Don Quixote in 1605 and 1615."
    }
,
    {
        id: 45,
        category: "History",
        difficulty: "hard",
        question: "Which of these historical events happened last?",
        options: ["Fall of Constantinople","Columbus reaching the Americas","Gutenberg's printing press","End of the Hundred Years' War"],
        correctAnswer: 1,
        explanation: "Columbus reached the Americas in 1492, after the printing press (c. 1440), the end of the Hundred Years' War (1453), and the fall of Constantinople (1453)."
    },
    {
        id: 46,
        category: "World Geography",
        difficulty: "medium",
        question: "Which is the largest country in Africa by area?",
        options: ["Nigeria","South Africa","Algeria","Egypt"],
        correctAnswer: 2,
        explanation: "Algeria is the largest country in Africa, at about 2.38 million km²."
    },
    {
        id: 47,
        category: "Science",
        difficulty: "easy",
        question: "Which gas is required for photosynthesis?",
        options: ["Oxygen","Carbon dioxide","Nitrogen","Hydrogen"],
        correctAnswer: 1,
        explanation: "Plants perform photosynthesis using carbon dioxide, water, and light."
    },
    {
        id: 48,
        category: "Arts & Culture",
        difficulty: "medium",
        question: "In which city is Leonardo da Vinci's 'The Last Supper' located?",
        options: ["Rome","Florence","Milan","Venice"],
        correctAnswer: 2,
        explanation: "The Last Supper is in the Convent of Santa Maria delle Grazie in Milan."
    }];
