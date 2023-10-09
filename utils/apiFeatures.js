class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // Model
    this.queryString = queryString; // req.query
  }

  filter() {
    const queryObj = { ...this.queryString };

    const excludedFields = ["page", "sort", "limit", "fields"]; // Pagination, Sorting, Limiting, Search Specific Field
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced Filtering
    // { difficulty: "easy", duration: { $gte: 5 } }
    // (?difficulty=easy&duration[gte]=5) // In query params
    // { difficulty: 'easy', duration: { gte: '5' } } // Output
    // gte, gt, lte, lt => $gte, $gt, $lte, $lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy); // ?sort=price,ratingAverage
    } else {
      this.query = this.query.sort("-createdAt"); // Default show the new one on the top
    }
    return this;
  }

  limitFields() {
    // ?fields=name,duration,difficulty,price
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" "); // only include or show the given property
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v"); //Exclude or remove it
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; // Trick:- convert string to a number
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // ?page=2&limit=10   // For page 1: 1-10, For page 2: 11-20, For page 3: 21-30 and so on
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
