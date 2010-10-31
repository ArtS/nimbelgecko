
        if (typeof req.session.currentCount === 'undefined') {
            req.session.currentCount = 1;
        } else {
            req.session.currentCount += 1;
        }

        req.sessionStore.set(req.sessionID, req.session,
            function(err) {
                if (err) {
                    console.log(err);
                    return;
                }

                req.sessionStore.get(req.sessionID, 
                    function() {
                        i(arguments);
                    }
                );
            }
        );

