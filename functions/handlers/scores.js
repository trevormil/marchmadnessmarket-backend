const axios = require('axios').default;

//gets all stocks
exports.getAllScores = (req, res) => {
    const url =
        'http://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';
    axios
        .get(url)
        .then((res) => {
            return res.data;
        })
        .then((response) => {
            let scores = [];

            response['events'].forEach((element) => {
                let gameInfo = {};
                gameInfo.name = element['name'];
                gameInfo.shortName = element['shortName'];
                gameInfo.score = [];
                element['competitions'].forEach((elem) => {
                    elem['competitors'].forEach((e) => {
                        
                        gameInfo.score.push({
                            score: e['score'],
                            logo: e['team']['logo'],
                        });
                    });
                });
                scores.push(gameInfo);
            });
            return res.status(201).json(scores);
        })
        .catch((err) => {
            console.log(err);
        });
};
