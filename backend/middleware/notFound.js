const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
};

module.exports = notFoundHandler;
