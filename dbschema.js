let db = {
  stocks: [
    {
      stockId: "",
      stockName: "",
      price: 10.0,
      market: "Soccer",
      bio: "Winger. Plays for Dortmund. 21 Years Old.",
      volume: 1200322,
      high: 10.23,
      open: 9.8,
      low: 9.23,
      marketCap: 345430,
      float: 34543,
      dividends: "", //to implement
    },
  ],
  trades: [
    {
      stockId: "c45wdsfkghashj6",
      tradeId: "ass452sjfdhskx56",
      buyingUserId: "12gasjg567hsjkd",
      sellingUserId: "",
      dateAndTime: "",
      sharesTraded: 100,
      sharesPrice: 10.2,
      completed: false,
    },
  ],
  users: [
    {
      bio: "",
      email: "",
      userId: "",
      userName: "",
      createdAt: "",
      accountBalance: "",
      phoneNum: "",
      accountValue: [
        {
          dateAndTime: "",
          accountValue: "",
        },
      ],
      ownedStocks: [
        {
          stockId: "",
          dateAndTime: "",
          sharesBought: "",
          buyPrice: "",
        },
      ],
      transactionHistory: [
        {
          tradeId: "",
          notes: "",
        },
      ],
      watchlist: [
        {
          stockId: "",
        },
      ],
      alerts: [
        {
          //to implement
        },
      ],
      notes: [
        {
          message: "",
          title: "",
          dateAndTime: "",
        },
      ],
    },
  ],
};
