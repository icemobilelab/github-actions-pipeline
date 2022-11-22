#!/usr/bin/env bash

set -e;

declare force=0
declare -r base_rb_name='github-actions-edit'
declare -r tst_url='https://api.r3vzjvjk.westeurope.aroapp.io:6443'
declare -r -a namespaces=(
    # Add new namespaces here
    safeway-ca-tst
    oxxo-mx-tst
    coop-vn-tst
    iga-ca-tst
    loyalty-tst
    club-leaf
)

usage() {
    cat <<EOUSAGE
Creates missing RoleBindings necessary for proper GitHub Actions operations.

Usage: "$0" [-f] [-h]

Options:
    -f      Forces recreating RoleBindings even if they already exists
    -h      Show this message
EOUSAGE
}

_error() {
    echo "$@"
    return 1;
}

_check_login_status() {
    if ! oc whoami -t &>/dev/null; then
        _error Please log into the TST cluster
    fi

    server="$(oc whoami --show-server)"
    if [ "$server" != "$tst_url" ]; then
        _error Please log into the TST cluster. Currently logged into "$server"
    fi
}

_check_rolebinding() {
    kubectl --namespace "$1" get rolebinding \
        "${base_rb_name}-${1}" \
        -o name &>/dev/null

    return $?;
}

_create_rolebinding() {
    kubectl --namespace "$1" create rolebinding \
        "${base_rb_name}-${1}" \
        --clusterrole=edit \
        --serviceaccount=cicd:github-actions-sa
}

_delete_rolebinding() {
    kubectl --namespace "$1" delete rolebinding \
        "${base_rb_name}-${1}"
}

_ignore_rolebinding() {
    echo "RoleBinding ${base_rb_name}-${1} already exists"
}

_setup_rolebindings() {
    for ns in "${namespaces[@]}"; do
        if _check_rolebinding "$ns"; then
            if [ "$force" -eq 1 ]; then
                _delete_rolebinding "$ns"
                _create_rolebinding "$ns"
            else
                _ignore_rolebinding "$ns"
            fi
        else
                _create_rolebinding "$ns"
        fi
    done
}

go() {
    _check_login_status
    _setup_rolebindings

    echo
    echo OK!
}

while getopts 'fh' arg; do
	case "${arg}" in
        f) force=1 ;;
		h) usage; exit 0 ;;
		*) usage; exit 1 ;;
	esac
done

go
