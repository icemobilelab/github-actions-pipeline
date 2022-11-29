#!/usr/bin/env bash

set -e;

declare force=0
declare delete=0
declare -r base_rb_name='github-actions'
declare -r tst_url='https://api.r3vzjvjk.westeurope.aroapp.io:6443'
declare -r -a admin_namespaces=(
    cicd
    build
)
declare -r -a edit_namespaces=(
    # Add new namespaces here
    club-leaf
    coop-vn-tst
    iga-ca-tst
    loyalty-tst
    oxxo-mx-tst
    safeway-ca-tst
)
declare -r -a cluster_roles=(
    namespace-editor
    self-provisioner
    # registry-editor
)

usage() {
    cat <<EOUSAGE
Creates missing RoleBindings necessary for proper GitHub Actions operations.

Usage: "$0" [-f | -D] [-h]

Options:
    -f      Forces recreating role bindings even if they already exists
    -D      Deletes all role existing bindings (conflicts with -f)
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

_get_ns_arg() {
    if [ -z "$ns" ]; then
        echo -n
    else
        echo -n "--namespace $ns"
    fi
}

_check() {
    local type="$1"
    local name="$2"
    local ns="$3"
    # shellcheck disable=SC2046
    kubectl $(_get_ns_arg "$ns") get "$type" \
        "$name" \
        -o name &>/dev/null

    return $?;
}

_create() {
    local type="$1"
    local name="$2"
    local role="$3"
    local ns="$4"
    # shellcheck disable=SC2046
    kubectl $(_get_ns_arg "$ns") create "$type" \
        "$name" \
        --clusterrole="$role" \
        --serviceaccount=cicd:github-actions-sa
}

_delete() {
    local type="$1"
    local name="$2"
    local ns="$3"
    # shellcheck disable=SC2046
    kubectl $(_get_ns_arg "$ns") delete "$type" \
        "$name"
}

_ignore() {
    local type="$1"
    local name="$2"
    if [ "$delete" -eq 1 ]; then
        echo "$1 ${name} doesn't exist"
    else
        echo "$1 ${name} already exists"
    fi
}



_setup_binding() {
    local type="$1"
    local name="$2"
    local role="$3"
    local ns="$4"

    if _check "$type" "$name" "$ns"; then
        if [ "$delete" -eq 1 ]; then
            _delete "$type" "$name" "$ns"
        elif [ "$force" -eq 1 ]; then
            _delete "$type" "$name" "$ns"
            _create "$type" "$name" "$role" "$ns"
        else
            _ignore "$type" "$name" "$ns"
        fi
    elif [ "$delete" -eq 1 ]; then
        _ignore "$type" "$name" "$ns"
    else
        _create "$type" "$name" "$role" "$ns"
    fi
}

_setup_edit_rolebindings() {
    for ns in "${edit_namespaces[@]}"; do
        local rb="${base_rb_name}-edit-${ns}"
        _setup_binding 'rolebinding' "$rb" 'edit' "$ns"
    done
}

_setup_admin_rolebindings() {
    for ns in "${admin_namespaces[@]}"; do
        local rb="${base_rb_name}-admin-${ns}"
        _setup_binding 'rolebinding' "$rb" 'admin' "$ns"
    done
}

_setup_cluster_rolebindings() {
    for cr in "${cluster_roles[@]}"; do
        local crb="${base_rb_name}-${cr}"
        _setup_binding 'clusterrolebinding' "$crb" "$cr"
    done
}

go() {
    _check_login_status
    _setup_edit_rolebindings
    _setup_admin_rolebindings
    _setup_cluster_rolebindings

    echo
    echo OK!
}

while getopts 'fhD' arg; do
	case "${arg}" in
        f) force=1 ;;
        D) delete=1 ;;
		h) usage; exit 0 ;;
		*) usage; exit 1 ;;
	esac
done

if [ "$delete" -eq 1 ] && [ "$force" -eq 1 ]; then
    usage
    _error "Options '-f' and '-D' are mutually exclusive"
fi


go
