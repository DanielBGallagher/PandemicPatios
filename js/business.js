const stringifyFormData = fd => {
    const data = {}
    for(let field of fd.keys()){
        data[field] = fd.get(field)
    }
    return JSON.stringify(data, null, 2)
}

const handleSubmit = e => {
    e.preventDefault();
    const data = new FormData(e.target);
    const stringified = stringifyFormData(data)
    sendBusiness(stringified)
}

//$("#form").on("submit", handleSubmit())

const form = document.getElementById('businessForm')
form.addEventListener('submit', handleSubmit)

const sendBusiness = async (review)=> {
    console.log(review)
    await fetch ('/business/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
          },
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        body: review
        })
}