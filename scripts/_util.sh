#!/usr/bin/env bash

_debug() {
    if [ -n "${DEBUG:-}" ]; then
        echo -e "\033[1;36m[debug]\033[0m $*"
    fi
}

_error() {
    echo -e "\033[1;31m[error]\033[0m $*"
    return 1;
}

_get_ns_arg() {
    local ns="${1:-}"
    if [ -z "$ns" ]; then
        echo -n
    else
        echo -n "--namespace $ns"
    fi
}

_get() {
    local type="$1"
    local name="$2"
    shift 2

    kubectl get "$type" "$name" "$@"
}

_check() {
    _get "$@" \
        -o name &>/dev/null
}

_create(){
    local type="$1"
    local name="$2"
    shift 2

    kubectl create "$type" "$name" "$@"
}

_delete() {
    local type="$1"
    local name="$2"
    shift 2

    kubectl delete "$type" "$name" "$@"
}

_confirm() {
    echo
    read -r -p "$* (y/N) " resp;
    if [ "$resp" = "y" ] || [ "$resp" = "Y" ]; then
        return 0;
    else
        return 1;
    fi
}

_check_serviceaccount() {
    local sa="$1"
    local ns="$2"
    _check serviceaccount "$sa" --namespace "$ns"
}

_create_serviceaccount() {
    local sa="$1"
    local ns="$2"
    _create serviceaccount "$sa" --namespace "$ns"
}

_delete_serviceaccount() {
    local sa="$1"
    local ns="$2"
    _delete serviceaccount "$sa" -n "$ns"
}

_check_binding() {
    local type="$1"
    local name="$2"
    local ns="${3:-}"
    # shellcheck disable=SC2046
    _check "$type" "$name" \
        $(set -e &>/dev/null; _get_ns_arg "$ns")

    return $?;
}

_create_binding() {
    local type="$1"
    local name="$2"
    local role="$3"
    local sa="$4"
    local ns="${5:-}"
    # shellcheck disable=SC2046
    _create "$type" "$name" \
        $(set -e &>/dev/null; _get_ns_arg "$ns") \
        --clusterrole="$role" \
        --serviceaccount="$sa"
}

_delete_binding() {
    local type="$1"
    local name="$2"
    local ns="${3:-}"
    # shellcheck disable=SC2046
    _delete "$type" "$name" \
        $(set -e &>/dev/null; _get_ns_arg "$ns")
}

_get_current_cluster() {
    if ! oc whoami -t &>/dev/null; then
        return 1
    fi

    oc whoami --show-server
}

_print_sa_token() {
    local sa="$1"
    local ns="$2"

    local secret=
    if ! secret="$(_get serviceaccount "$sa" -n "$ns" \
        -o go-template='{{range .secrets}}{{.name}}{{"\n"}}{{end}}' \
        2>/dev/null | grep 'token')" || [ -z "$secret" ]; then
        if ! secret="$(_get secret -n "$ns" \
            -o jsonpath="{range .items[?(@.metadata.annotations['kubernetes\.io/service-account\.name'] == \"github-actions-sa\")].metadata.name}{@}{'\n'}{end}" \
            | grep 'token')" || [ -z "$secret" ]; then
            _error "Couldn't find any secrets in namespace $ns belonging to ServiceAccount $sa." \
                "Try looking for it yourself. Its name will be ${sa}-token-XXXX, where XXXX" \
                "is a random alphanumeric string"
        fi
    fi

    local token=
    # shellcheck disable=SC2310
    if token="$(set -e; _get secret "$secret" -n "$ns" -o go-template='{{.data.token}}' | base64 -d)"; then
        echo
        echo "------ START TOKEN ------"
        echo "$token"
        echo "------- END TOKEN -------"
    else
        return 1
    fi
}

_ignore_missing() {
    local type="$1"
    local name="$2"

    echo "${type} ${name} doesn't exist"
}

_ignore_existing() {
    local type="$1"
    local name="$2"

    echo "${type} ${name} already exists"
}
