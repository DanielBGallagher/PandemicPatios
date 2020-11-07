const express = require('express');
const router = express.Router();
const db = require('../models');
const fetch = require('node-fetch')



function loggedIn(req, res, next) {

    if(req.user){
        next()
    } else {
        res.redirect('/')
    }

}




//Sends every review back
router.get('/all', async (req, res)=> {
    const reviews = await db.Review.findAll();
    res.send(reviews);
})
//Sends every review about a specific Restaurant
router.get('/restaurant/:resID', async (req, res)=> {
    const resID = req.params.resID;
    const resRev = await db.Review.findAll({
        where: {
            RestaurantId: resID
        }
    })
    res.send(resRev);
})

// Sends averages from all reviews for a specific restaurant
router.get('/restaurant/reviews/:resID', async (req, res) => {
    const resID = req.params.resID;
    let allReviews = await avgReviews(resID);
    console.log("this is allReviews from the router", allReviews);
    reviewsHTML = `<html>
    <head>
    </head>
    <body>
        <div>
            <h1>Reviews</h1>
            <ul>
                <li>
                    Mask Rating: ${allReviews.maskAvg}
                </li>
                <li>
                    Social Distancing Rating: ${allReviews.socialDistancingAvg}
                </li>
                <li>
                    Sanitation Rating: ${allReviews.sanitationAvg}
                </li>
                <li>
                    Has Alcohol: ${allReviews.alcoholAvg}
                </li>
                <li>
                    Food Rating: ${allReviews.foodAvg}
                </li>
                <li>
                    Service Rating: ${allReviews.serviceAvg}
                </li>
                <li>
                    Type of Atmosphere: ${allReviews.atmosphereAvg}
                </li>
                <li>
                    Patio Space Rating: ${allReviews.patioAvg}
                </li>
                <li>
                    Is Pet Friendly: ${allReviews.petFriendlyAvg}
                </li>
            </ul>
            <a href="/form">Add Your Review</a>
            <a href="/">Go Back to the Main Page</a>
        </div>
    </body>
</html>`
    res.send(reviewsHTML);
})

async function avgReviews(resID) {
    var restReviews = await fetch(`http://localhost:9000/review/restaurant/${resID}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
          },
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
    })

    restReviews = await restReviews.json()

    let revLength = restReviews.length;
    // Creating the variables to make averages for each category
    let maskTotal = 0;
    let socialDistancingTotal = 0;
    let sanitationTotal = 0;
    let alcoholTotal = {"Yes": 0, "No": 0};
    let foodTotal = 0;
    let serviceTotal = 0;
    let atmosphere = [];
    let patioTotal = 0;
    let petFriendlyTotal = {"Yes": 0, "No": 0};

    // Goes through all the reviews and sums up each category total
    for(let i=0; i<revLength; i++) {
        // sum up all the ratings for each category
        maskTotal += restReviews[i].maskRating;
        socialDistancingTotal += restReviews[i].socialDistancingRating;
        sanitationTotal += restReviews[i].sanitationRating;
        foodTotal += restReviews[i].foodRating;
        serviceTotal += restReviews[i].serviceRating;
        patioTotal += restReviews[i].patioSpaceRating;

        //keep track of the yes and no responses for alcohol and petfriendly
        if (restReviews[i].alcohol === "yes") {
            alcoholTotal["Yes"] += 1
        }
        else {
            alcoholTotal["No"] += 1
        }

        if (restReviews[i].petFriendly === "yes") {
            petFriendlyTotal["Yes"] += 1
        }
        else {
            petFriendlyTotal["No"] += 1
        }

        //only add an atmosphere response if it is not in the array already
        if(atmosphere.indexOf(restReviews[i].atmosphere) === -1) {
            atmosphere.push(restReviews[i].atmosphere)
        }

    }

    // Find the average of each
    let avgRestReviews = {
        maskAvg : Math.round((maskTotal / revLength) * 10) / 10,
        socialDistancingAvg : Math.round((socialDistancingTotal / revLength) * 10) / 10,
        sanitationAvg : Math.round((sanitationTotal / revLength) * 10) / 10,
        alcoholAvg: JSON.stringify(alcoholTotal),
        foodAvg : Math.round((foodTotal / revLength) * 10) / 10,
        serviceAvg : Math.round((serviceTotal / revLength) * 10) / 10,
        patioAvg : Math.round((patioTotal / revLength) * 10) / 10,
        atmosphereAvg: atmosphere,
        petFriendlyAvg: JSON.stringify(petFriendlyTotal)

    }

    console.log(avgRestReviews)
    return avgRestReviews
}

//Sends every review made by a specific user
router.get('/user/:userID', async (req, res)=> {
    const userID = req.params.userID;
    const userRev = await db.Review.findAll({
        where: {
            UserID: userID
        }
    })
    res.send(userRev);
})
//Deletes a review
router.delete('/:id', async (req, res)=> {
    const id = req.params.id;
    const deletedReview = await db.Review.destroy({
        where: {
            id: id
        }
    });
    res.send(deletedReview)
})

router.post('/add', loggedIn,  async (req, res)=> {
    console.log(req.user.provider)
    //gets logged in user's authID



    const UserId = req.user.id
    //passes UserId to getAuthID in order to return Id of that user
    var strat;

    if (req.user.provider == "twitter") {
        strat = 1
    }
    else if (req.user.provider == "facebook") {
        strat = 2
    }
    else if (req.user.provider == "google") {
        strat = 3
    }
    else if (req.user.provider == "github") {
        strat = 4
    }

    const authId = await getAuthID(UserId, strat)
    console.log(authId)
    const { maskRating, socialDistancingRating, sanitationRating, alcohol, foodRating, serviceRating, atmosphere, patioSpaceRating, petFriendly, RestaurantId } = req.body

    const newReview = await db.Review.create({
        maskRating,
        socialDistancingRating,
        sanitationRating,
        alcohol,
        foodRating,
        serviceRating,
        atmosphere,
        patioSpaceRating,
        petFriendly,
        RestaurantId,
        UserId: authId
    })

    res.send(newReview)
})

router.patch('/update/:id', async (req, res)=> {
    const { id } = req.params;

    const updateReview = await db.Review.update(req.body, {
        where: {
            id
        }
    })

    res.send(updateReview)
})



//returns ID field of user when passed an authID
const getAuthID = async (id, strat)=> {

    var user = await fetch(`http://localhost:9000/user/reviewUser/${id}/${strat}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
          },
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
    })

    user = await user.json()
    return user[0].id
    
}




module.exports = router