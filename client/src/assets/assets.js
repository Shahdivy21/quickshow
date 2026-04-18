import logo from './logo.svg'
import marvelLogo from './marvelLogo.svg'
import googlePlay from './googlePlay.svg'
import appStore from './appStore.svg'
import screenImage from './screenImage.svg'
import profile from './profile.png'

export const assets = {
    logo,
    marvelLogo,
    googlePlay,
    appStore,
    screenImage,
    profile
}


const dummyCastsData = [
    { "name": "Milla Jovovich", "profile_path": "https://image.tmdb.org/t/p/original/usWnHCzbADijULREZYSJ0qfM00y.jpg", },
    { "name": "Dave Bautista", "profile_path": "https://image.tmdb.org/t/p/original/snk6JiXOOoRjPtHU5VMoy6qbd32.jpg", },
    { "name": "Arly Jover", "profile_path": "https://image.tmdb.org/t/p/original/zmznPrQ9GSZwcOIUT0c3GyETwrP.jpg", },
    { "name": "Amara Okereke", "profile_path": "https://image.tmdb.org/t/p/original/nTSPtzWu6deZTJtWXHUpACVznY4.jpg", },
    { "name": "Fraser James", "profile_path": "https://image.tmdb.org/t/p/original/mGAPQG2OKTgdKFkp9YpvCSqcbgY.jpg", },
    { "name": "Deirdre Mullins", "profile_path": "https://image.tmdb.org/t/p/original/lJm89neuiVlYISEqNpGZA5kTAnP.jpg", },
    { "name": "Sebastian Stankiewicz", "profile_path": "https://image.tmdb.org/t/p/original/hLN0Ca09KwQOFLZLPIEzgTIbqqg.jpg", },
    { "name": "Tue Lunding", "profile_path": "https://image.tmdb.org/t/p/original/qY4W0zfGBYzlCyCC0QDJS1Muoa0.jpg", },
    { "name": "Jacek Dzisiewicz", "profile_path": "https://image.tmdb.org/t/p/original/6Ksb8ANhhoWWGnlM6O1qrySd7e1.jpg", },
    { "name": "Ian Hanmore", "profile_path": "https://image.tmdb.org/t/p/original/yhI4MK5atavKBD9wiJtaO1say1p.jpg", },
    { "name": "Eveline Hall", "profile_path": "https://image.tmdb.org/t/p/original/uPq4xUPiJIMW5rXF9AT0GrRqgJY.jpg", },
    { "name": "Kamila Klamut", "profile_path": "https://image.tmdb.org/t/p/original/usWnHCzbADijULREZYSJ0qfM00y.jpg", },
    { "name": "Caoilinn Springall", "profile_path": "https://image.tmdb.org/t/p/original/uZNtbPHowlBYo74U1qlTaRlrdiY.jpg", },
    { "name": "Jan Kowalewski", "profile_path": "https://image.tmdb.org/t/p/original/snk6JiXOOoRjPtHU5VMoy6qbd32.jpg", },
    { "name": "Pawel Wysocki", "profile_path": "https://image.tmdb.org/t/p/original/zmznPrQ9GSZwcOIUT0c3GyETwrP.jpg", },
    { "name": "Simon Lööf", "profile_path": "https://image.tmdb.org/t/p/original/cbZrB8crWlLEDjVUoak8Liak6s.jpg", },
    { "name": "Tomasz Cymerman", "profile_path": "https://image.tmdb.org/t/p/original/nTSPtzWu6deZTJtWXHUpACVznY4.jpg", }
]

export const dummyShowsData = [
    {
        "_id": "324544",
        "id": 324544,
        "title": "In the Lost Lands",
        "overview": "A queen sends the powerful and feared sorceress Gray Alys to the ghostly wilderness of the Lost Lands in search of a magical power, where she and her guide, the drifter Boyce, must outwit and outfight both man and demon.",
        "poster_path": "https://image.tmdb.org/t/p/original/dDlfjR7gllmr8HTeN6rfrYhTdwX.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/op3qmNhvwEvyT7UFyPbIfQmKriB.jpg",
        "genres": [
            { "id": 28, "name": "Action" },
            { "id": 14, "name": "Fantasy" },
            { "id": 12, "name": "Adventure" }
        ],
        "casts": dummyCastsData,
        "release_date": "2025-02-27",
        "original_language": "en",
        "tagline": "She seeks the power to free her people.",
        "vote_average": 6.4,
        "vote_count": 15000,
        "runtime": 102,
    },
    {
        "_id": "1232546",
        "id": 1232546,
        "title": "Until Dawn",
        "overview": "One year after her sister Melanie mysteriously disappeared, Clover and her friends head into the remote valley where she vanished in search of answers. Exploring an abandoned visitor center, they find themselves stalked by a masked killer and horrifically murdered one by one...only to wake up and find themselves back at the beginning of the same evening.",
        "poster_path": "https://image.tmdb.org/t/p/original/juA4IWO52Fecx8lhAsxmDgy3M3.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/icFWIk1KfkWLZnugZAJEDauNZ94.jpg",
        "genres": [
            { "id": 27, "name": "Horror" },
            { "id": 9648, "name": "Mystery" }
        ],
        "casts": dummyCastsData,
        "release_date": "2025-04-23",
        "original_language": "en",
        "tagline": "Every night a different nightmare.",
        "vote_average": 6.405,
        "vote_count": 18000,
        "runtime": 103,
    },
    {
        "_id": "552524",
        "id": 552524,
        "title": "Lilo & Stitch",
        "overview": "The wildly funny and touching story of a lonely Hawaiian girl and the fugitive alien who helps to mend her broken family.",
        "poster_path": "https://image.tmdb.org/t/p/original/mKKqV23MQ0uakJS8OCE2TfV5jNS.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/7Zx3wDG5bBtcfk8lcnCWDOLM4Y4.jpg",
        "genres": [
            { "id": 10751, "name": "Family" },
            { "id": 35, "name": "Comedy" },
            { "id": 878, "name": "Science Fiction" }
        ],
        "casts": dummyCastsData,
        "release_date": "2025-05-17",
        "original_language": "en",
        "tagline": "Hold on to your coconuts.",
        "vote_average": 7.117,
        "vote_count": 27500,
        "runtime": 108,
    },
    {
        "_id": "668489",
        "id": 668489,
        "title": "Havoc",
        "overview": "When a drug heist swerves lethally out of control, a jaded cop fights his way through a corrupt city's criminal underworld to save a politician's son.",
        "poster_path": "https://image.tmdb.org/t/p/original/ubP2OsF3GlfqYPvXyLw9d78djGX.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/65MVgDa6YjSdqzh7YOA04mYkioo.jpg",
        "genres": [
            { "id": 28, "name": "Action" },
            { "id": 80, "name": "Crime" },
            { "id": 53, "name": "Thriller" }
        ],
        "casts": dummyCastsData,
        "release_date": "2025-04-25",
        "original_language": "en",
        "tagline": "No law. Only disorder.",
        "vote_average": 6.537,
        "vote_count": 35960,
        "runtime": 107,
    },
    {
        "_id": "950387",
        "id": 950387,
        "title": "A Minecraft Movie",
        "overview": "Four misfits find themselves struggling with ordinary problems when they are suddenly pulled through a mysterious portal into the Overworld: a bizarre, cubic wonderland that thrives on imagination. To get back home, they'll have to master this world while embarking on a magical quest with an unexpected, expert crafter, Steve.",
        "poster_path": "https://image.tmdb.org/t/p/original/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg",
        "genres": [
            { "id": 10751, "name": "Family" },
            { "id": 35, "name": "Comedy" },
            { "id": 12, "name": "Adventure" },
            { "id": 14, "name": "Fantasy" }
        ],
        "casts": dummyCastsData,
        "release_date": "2025-03-31",
        "original_language": "en",
        "tagline": "Be there and be square.",
        "vote_average": 6.516,
        "vote_count": 15225,
        "runtime": 101,
    },
    {
        "_id": "575265",
        "id": 575265,
        "title": "Mission: Impossible - The Final Reckoning",
        "overview": "Ethan Hunt and team continue their search for the terrifying AI known as the Entity — which has infiltrated intelligence networks all over the globe — with the world's governments and a mysterious ghost from Hunt's past on their trail. Joined by new allies and armed with the means to shut the Entity down for good, Hunt is in a race against time to prevent the world as we know it from changing forever.",
        "poster_path": "https://image.tmdb.org/t/p/original/z53D72EAOxGRqdr7KXXWp9dJiDe.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/1p5aI299YBnqrEEvVGJERk2MXXb.jpg",
        "genres": [
            { "id": 28, "name": "Action" },
            { "id": 12, "name": "Adventure" },
            { "id": 53, "name": "Thriller" }
        ],
        "casts": dummyCastsData,
        "release_date": "2025-05-17",
        "original_language": "en",
        "tagline": "Our lives are the sum of our choices.",
        "vote_average": 7.042,
        "vote_count": 19885,
        "runtime": 170,
    },
    {
        "_id": "986056",
        "id": 986056,
        "title": "Thunderbolts*",
        "overview": "After finding themselves ensnared in a death trap, seven disillusioned castoffs must embark on a dangerous mission that will force them to confront the darkest corners of their pasts.",
        "poster_path": "https://image.tmdb.org/t/p/original/m9EtP1Yrzv6v7dMaC9mRaGhd1um.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/rthMuZfFv4fqEU4JVbgSW9wQ8rs.jpg",
        "genres": [
            { "id": 28, "name": "Action" },
            { "id": 878, "name": "Science Fiction" },
            { "id": 12, "name": "Adventure" }
        ],
        "casts": dummyCastsData,
        "release_date": "2025-04-30",
        "original_language": "en",
        "tagline": "Everyone deserves a second shot.",
        "vote_average": 7.443,
        "vote_count": 23569,
        "runtime": 127,
    },

    // --- Coming Soon (add to dummyShowsData) ---
{
  _id: "upc_vega",
  title: "Space Mission: Vega",
  release_date: "2025-09-20",
  runtime: 132,
  genres: [{ name: "Sci-Fi" }, { name: "Adventure" }],
  overview:
    "A rookie ISRO pilot is forced into a deep-space rescue that uncovers a signal from beyond our galaxy.",
  vote_average: 0,
  poster_path: "https://picsum.photos/400/600?random=201",   // replace with your poster
  backdrop_path: "https://picsum.photos/600/900?random=201", // MovieCard uses this
  casts: [
    { name: "Ishan Mehta",  profile_path: "https://i.pravatar.cc/100?img=11" },
    { name: "Ayesha Rao",   profile_path: "https://i.pravatar.cc/100?img=12" }
  ]
},
{
  _id: "upc_monsoon",
  title: "Monsoon Diaries",
  release_date: "2025-10-04",
  runtime: 118,
  genres: [{ name: "Romance" }, { name: "Drama" }],
  overview:
    "Two strangers share a cab during Mumbai rains and end up rewriting each other’s lives.",
  vote_average: 0,
  poster_path: "https://picsum.photos/400/600?random=202",
  backdrop_path: "https://picsum.photos/600/900?random=202",
  casts: [
    { name: "Ritika Sen",   profile_path: "https://i.pravatar.cc/100?img=13" },
    { name: "Dev Anand",    profile_path: "https://i.pravatar.cc/100?img=14" }
  ]
},
{
  _id: "upc_heist",
  title: "Desi Heist",
  release_date: "2025-09-05",
  runtime: 126,
  genres: [{ name: "Action" }, { name: "Thriller" }],
  overview:
    "A small-town genius plans India’s cleanest bank heist—but the real twist is who he’s stealing from.",
  vote_average: 0,
  poster_path: "https://picsum.photos/400/600?random=203",
  backdrop_path: "https://picsum.photos/600/900?random=203",
  casts: [
    { name: "Kabir Khan",   profile_path: "https://i.pravatar.cc/100?img=15" },
    { name: "Naina Kapoor", profile_path: "https://i.pravatar.cc/100?img=16" }
  ]
},
{
  _id: "upc_khoj",
  title: "Khoj: The Lost Temple",
  release_date: "2025-10-25",
  runtime: 124,
  genres: [{ name: "Mystery" }, { name: "Adventure" }],
  overview:
    "An archaeologist follows ancient Sanskrit clues to a hidden temple deep in the Western Ghats.",
  vote_average: 0,
  poster_path: "https://picsum.photos/400/600?random=204",
  backdrop_path: "https://picsum.photos/600/900?random=204",
  casts: [
    { name: "Ananya Pillai", profile_path: "https://i.pravatar.cc/100?img=17" },
    { name: "Rohit Varma",   profile_path: "https://i.pravatar.cc/100?img=18" }
  ]
},
{
  _id: "upc_garuda",
  title: "Project Garuda",
  release_date: "2025-11-01",
  runtime: 138,
  genres: [{ name: "Action" }, { name: "Sci-Fi" }],
  overview:
    "A defence hacker races to stop a rogue AI that has seized a hypersonic drone over the Indian Ocean.",
  vote_average: 0,
  poster_path: "https://picsum.photos/400/600?random=205",
  backdrop_path: "https://picsum.photos/600/900?random=205",
  casts: [
    { name: "Mira Das",     profile_path: "https://i.pravatar.cc/100?img=19" },
    { name: "Arjun Suri",   profile_path: "https://i.pravatar.cc/100?img=20" }
  ]
},
{
  _id: "upc_stars",
  title: "Under the Same Stars",
  release_date: "2025-12-05",
  runtime: 112,
  genres: [{ name: "Family" }, { name: "Comedy" }],
  overview:
    "A chaotic joint family road-trip to Kutch turns into a journey of second chances.",
  vote_average: 0,
  poster_path: "https://picsum.photos/400/600?random=206",
  backdrop_path: "https://picsum.photos/600/900?random=206",
  casts: [
    { name: "Raghav Iyer",  profile_path: "https://i.pravatar.cc/100?img=21" },
    { name: "Pooja Menon",  profile_path: "https://i.pravatar.cc/100?img=22" }
  ]
}

]

export const dummyDateTimeData = {
    "2025-07-24": [
        { "time": "2025-07-24T01:00:00.000Z", "showId": "68395b407f6329be2bb45bd1" },
        { "time": "2025-07-24T03:00:00.000Z", "showId": "68395b407f6329be2bb45bd2" },
        { "time": "2025-07-24T05:00:00.000Z", "showId": "68395b407f6329be2bb45bd3" }
    ],
    "2025-07-25": [
        { "time": "2025-07-25T01:00:00.000Z", "showId": "68395b407f6329be2bb45bd4" },
        { "time": "2025-07-25T03:00:00.000Z", "showId": "68395b407f6329be2bb45bd5" },
        { "time": "2025-07-25T05:00:00.000Z", "showId": "68395b407f6329be2bb45bd6" }
    ],
    "2025-07-26": [
        { "time": "2025-07-26T01:00:00.000Z", "showId": "68395b407f6329be2bb45bd7" },
        { "time": "2025-07-26T03:00:00.000Z", "showId": "68395b407f6329be2bb45bd8" },
        { "time": "2025-07-26T05:00:00.000Z", "showId": "68395b407f6329be2bb45bd9" }
    ],
    "2025-07-27": [
        { "time": "2025-07-27T01:00:00.000Z", "showId": "68395b407f6329be2bb45bda" },
        { "time": "2025-07-27T03:00:00.000Z", "showId": "68395b407f6329be2bb45bdb" },
        { "time": "2025-07-27T05:00:00.000Z", "showId": "68395b407f6329be2bb45bdc" }
    ]
}

export const dummyDashboardData = {
    "totalBookings": 14,
    "totalRevenue": 1517,
    "totalUser": 5,
    "activeShows": [
        {
            "_id": "68352363e96d99513e4221a4",
            "movie": dummyShowsData[0],
            "showDateTime": "2025-06-30T02:30:00.000Z",
            "showPrice": 59,
            "occupiedSeats": {
                "A1": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok",
                "B1": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok",
                "C1": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok"
            },
        },
        {
            "_id": "6835238fe96d99513e4221a8",
            "movie": dummyShowsData[1],
            "showDateTime": "2025-06-30T15:30:00.000Z",
            "showPrice": 81,
            "occupiedSeats": {},
        },
        {
            "_id": "6835238fe96d99513e4221a9",
            "movie": dummyShowsData[2],
            "showDateTime": "2025-06-30T03:30:00.000Z",
            "showPrice": 81,
            "occupiedSeats": {},
        },
        {
            "_id": "6835238fe96d99513e4221aa",
            "movie": dummyShowsData[3],
            "showDateTime": "2025-07-15T16:30:00.000Z",
            "showPrice": 81,
            "occupiedSeats": {
                "A1": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok",
                "A2": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok",
                "A3": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok",
                "A4": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok"
            },
        },
        {
            "_id": "683682072b5989c29fc6dc0d",
            "movie": dummyShowsData[4],
            "showDateTime": "2025-06-05T15:30:00.000Z",
            "showPrice": 49,
            "occupiedSeats": {
                "A1": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok",
                "A2": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok",
                "A3": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok",
                "B1": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok",
                "B2": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok",
                "B3": "user_2xO4XPCgWWwWq9EHuQxc5UWqIok"
            },
            "__v": 0
        },
        {
            "_id": "68380044686d454f2116b39a",
            "movie": dummyShowsData[5],
            "showDateTime": "2025-06-20T16:00:00.000Z",
            "showPrice": 79,
            "occupiedSeats": {
                "A1": "user_2xl7eCSUHddibk5lRxfOtw9RMwX",
                "A2": "user_2xl7eCSUHddibk5lRxfOtw9RMwX"
            }
        }
    ]
}


export const dummyBookingData = [
    {
        "_id": "68396334fb83252d82e17295",
        "user": { "name": "Harsh", },
        "show": {
            _id: "68352363e96d99513e4221a4",
            movie: dummyShowsData[0],
            showDateTime: "2025-06-30T02:30:00.000Z",
            showPrice: 59,
        },
        "amount": 98,
        "bookedSeats": ["D1", "D2"],
        "isPaid": false,
    },
    {
        "_id": "68396334fb83252d82e17295",
        "user": { "name": "Nandan", },
        "show": {
            _id: "68352363e96d99513e4221a4",
            movie: dummyShowsData[0],
            showDateTime: "2025-06-30T02:30:00.000Z",
            showPrice: 59,
        },
        "amount": 49,
        "bookedSeats": ["A1"],
        "isPaid": true,
    },
    {
        "_id": "68396334fb83252d82e17295",
        "user": { "name": "Rushil", },
        "show": {
            _id: "68352363e96d99513e4221a4",
            movie: dummyShowsData[0],
            showDateTime: "2025-06-30T02:30:00.000Z",
            showPrice: 59,
        },
        "amount": 147,
        "bookedSeats": ["A1", "A2","A3"],
        "isPaid": true,
    },
]

// assets/assets.js

export const dummyTheaters = [

  // ---- Indian style theaters ----
  {
    id: "th_pvr",
    name: "PVR Cinemas",
    address: "Phoenix Marketcity Mall, Kurla",
    city: "Mumbai",
    phone: "+91-22-4455-8899",
    amenities: ["Gold Class", "IMAX", "Snacks", "Recliners"],
    hours: "09:00 AM – 01:00 AM",
  },
  {
    id: "th_inox",
    name: "INOX Megaplex",
    address: "R City Mall, Ghatkopar",
    city: "Mumbai",
    phone: "+91-22-2233-7744",
    amenities: ["4DX", "Dolby Atmos", "Food Court", "Online Booking"],
    hours: "09:00 AM – 12:30 AM",
  },
  {
    id: "th_cinepolis",
    name: "Cinépolis",
    address: "Forum Mall, Koramangala",
    city: "Bengaluru",
    phone: "+91-80-2266-7788",
    amenities: ["VIP Lounge", "3D", "Snacks", "Recliners"],
    hours: "10:00 AM – 12:00 AM",
  },
  {
    id: "th_sathyam",
    name: "SPI Sathyam Cinemas",
    address: "Royapettah, Mount Road",
    city: "Chennai",
    phone: "+91-44-4455-6677",
    amenities: ["Dolby Atmos", "Luxury Seats", "Popcorn Studio"],
    hours: "10:00 AM – 11:45 PM",
  },
  {
    id: "th_prasads",
    name: "Prasads IMAX",
    address: "Necklace Road",
    city: "Hyderabad",
    phone: "+91-40-2233-8899",
    amenities: ["IMAX", "Food Court", "Arcade", "Parking"],
    hours: "09:30 AM – 12:15 AM",
  },
  {
    id: "th_rajmandir",
    name: "Rajmandir Cinema",
    address: "Panch Batti, C-Scheme",
    city: "Jaipur",
    phone: "+91-141-222-7788",
    amenities: ["Single Screen", "Royal Interiors", "Snacks"],
    hours: "12:00 PM – 11:00 PM",
  },
  {
    id: "th_asian",
    name: "Asian Cinemas",
    address: "Kukatpally",
    city: "Hyderabad",
    phone: "+91-40-6677-8899",
    amenities: ["Multiplex", "Recliners", "Dolby Sound"],
    hours: "10:00 AM – 12:00 AM",
  },
];


// assets/dummySeatLayouts.js
// assets/dummySeatLayouts.js (inside assets.js if you prefer)
export const dummySeatLayouts = {
  th_pvr: { 
    rows: [["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"]],
    seatsPerRow: 8
  },
  th_inox: { 
    rows: [["A", "B", "C"], ["D", "E"], ["F", "G", "H", "I"]],
    seatsPerRow: 10
  },
  th_cinepolis: { 
    rows: [["A"], ["B", "C", "D"], ["E", "F", "G"]],
    seatsPerRow: 10
  },
  th_sathyam: { 
    rows: [["A", "B"], ["C", "D", "E"], ["F", "G", "H"]],
    seatsPerRow: 9
  },
  th_prasads: { 
    rows: [["A", "B"], ["C", "D"], ["E", "F", "G"]],
    seatsPerRow: 11
  },
  th_rajmandir: { 
    rows: [["A"], ["B", "C"], ["D", "E"], ["F", "G"]],
    seatsPerRow: 6
  },
  th_asian: { 
    rows: [["A", "B"], ["C", "D", "E"], ["F", "G", "H", "I"]],
    seatsPerRow: 10
  }
}









