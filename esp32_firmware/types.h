#ifndef TYPES_H
#define TYPES_H

#include <Arduino.h>

struct UserJWT {
    String username;
    String role;
    bool isValid;
};

#endif
